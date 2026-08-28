import {
  Controller,
  Get,
  Headers,
  HttpException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SongSourceType, UserRole } from '@prisma/client';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { CatalogService } from './catalog.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { MediaStorageService } from './media-storage.service.js';
import { RemoteAudioPolicyService } from './remote-audio-policy.service.js';

@Controller()
export class MediaController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly mediaStorage: MediaStorageService,
    private readonly remoteAudioPolicy: RemoteAudioPolicyService,
  ) {}

  @Get('audio/:publicId')
  async streamAudio(
    @Param('publicId') publicId: string,
    @Headers('range') rangeHeader: string | undefined,
    @Res() response: Response,
  ) {
    const song = await this.catalogService.getPlayableSong(publicId);
    await this.sendAudio(song, rangeHeader, response);
  }

  @Get('admin/songs/:id/audio')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async streamAdminAudio(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Headers('range') rangeHeader: string | undefined,
    @Res() response: Response,
  ) {
    const song = await this.catalogService.getAdminPlayableSong(id);
    await this.sendAudio(song, rangeHeader, response);
  }

  private async sendAudio(
    song: Awaited<ReturnType<CatalogService['getPlayableSong']>>,
    rangeHeader: string | undefined,
    response: Response,
  ) {
    if (song.sourceType === SongSourceType.REMOTE) {
      if (!song.remoteUrl) {
        throw this.audioUnavailable();
      }
      const remoteUrl = this.remoteAudioPolicy.assertAllowed(song.remoteUrl);
      void this.catalogService
        .incrementPlayCount(song.id)
        .catch(() => undefined);
      response.redirect(302, remoteUrl.toString());
      return;
    }

    if (!song.audioAsset) {
      throw this.audioUnavailable();
    }

    const filePath = this.mediaStorage.resolveStoragePath(
      song.audioAsset.storagePath,
    );
    let fileStats;
    try {
      fileStats = await stat(filePath);
    } catch {
      throw this.audioUnavailable();
    }

    const range = this.parseRange(rangeHeader, fileStats.size);
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('Content-Type', song.audioAsset.mimeType);
    response.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

    if (range) {
      response.status(206);
      response.setHeader(
        'Content-Range',
        `bytes ${range.start}-${range.end}/${fileStats.size}`,
      );
      response.setHeader('Content-Length', range.end - range.start + 1);
      createReadStream(filePath, range).pipe(response);
    } else {
      response.status(200);
      response.setHeader('Content-Length', fileStats.size);
      createReadStream(filePath).pipe(response);
    }

    void this.catalogService.incrementPlayCount(song.id).catch(() => undefined);
  }

  @Get('assets/:id')
  async streamAsset(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Res() response: Response,
  ) {
    const asset = await this.catalogService.getPublicAsset(id);
    const filePath = this.mediaStorage.resolveStoragePath(asset.storagePath);
    let fileStats;
    try {
      fileStats = await stat(filePath);
    } catch {
      throw new NotFoundException({
        code: 'ASSET_FILE_NOT_FOUND',
        message: '图片文件不存在',
      });
    }

    response.status(200);
    response.setHeader('Content-Type', asset.mimeType);
    response.setHeader('Content-Length', fileStats.size);
    response.setHeader('ETag', `"${asset.checksum}"`);
    response.setHeader('Cache-Control', 'public, max-age=86400');
    createReadStream(filePath).pipe(response);
  }

  private parseRange(value: string | undefined, size: number) {
    if (!value) return null;
    const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
    if (!match || (!match[1] && !match[2])) {
      throw this.invalidRange(size);
    }

    let start: number;
    let end: number;
    if (!match[1]) {
      const suffixLength = Number(match[2]);
      if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
        throw this.invalidRange(size);
      }
      start = Math.max(0, size - suffixLength);
      end = size - 1;
    } else {
      start = Number(match[1]);
      end = match[2] ? Number(match[2]) : size - 1;
    }

    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 0 ||
      start >= size ||
      end < start
    ) {
      throw this.invalidRange(size);
    }

    return { start, end: Math.min(end, size - 1) };
  }

  private invalidRange(size: number) {
    return new HttpException(
      {
        code: 'INVALID_RANGE',
        message: '请求的音频范围无效',
        contentRange: `bytes */${size}`,
      },
      416,
    );
  }

  private audioUnavailable() {
    return new NotFoundException({
      code: 'AUDIO_UNAVAILABLE',
      message: '音频资源暂时无法播放',
    });
  }
}
