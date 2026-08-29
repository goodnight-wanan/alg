import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rm, stat } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import {
  Injectable,
  OnModuleInit,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileAssetKind, Prisma } from '@prisma/client';
import sharp from 'sharp';

const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.m4a',
  '.aac',
  '.ogg',
  '.wav',
  '.flac',
]);
const COVER_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.avif',
]);

interface AudioProbeResult {
  format?: {
    duration?: string;
    bit_rate?: string;
  };
  streams?: Array<{
    codec_type?: string;
    duration?: string;
    bit_rate?: string;
  }>;
}

export interface ProcessedAsset {
  data: Prisma.FileAssetCreateInput;
  absolutePath: string;
  durationSeconds?: number;
  bitrateKbps?: number;
}

@Injectable()
export class MediaStorageService implements OnModuleInit {
  private readonly mediaRoot: string;
  private readonly tempRoot: string;
  private readonly audioRoot: string;
  private readonly coverRoot: string;
  private readonly avatarRoot: string;

  constructor(private readonly configService: ConfigService) {
    const configuredRoot = this.configService.get<string>(
      'MEDIA_ROOT',
      './uploads',
    );
    this.mediaRoot = resolve(configuredRoot);
    this.tempRoot = join(this.mediaRoot, 'tmp');
    this.audioRoot = join(this.mediaRoot, 'audio');
    this.coverRoot = join(this.mediaRoot, 'covers');
    this.avatarRoot = join(this.mediaRoot, 'avatars');
  }

  async onModuleInit() {
    await Promise.all([
      mkdir(this.tempRoot, { recursive: true }),
      mkdir(this.audioRoot, { recursive: true }),
      mkdir(this.coverRoot, { recursive: true }),
      mkdir(this.avatarRoot, { recursive: true }),
    ]);
  }

  getTemporaryRoot() {
    return this.tempRoot;
  }

  async processAudio(file: Express.Multer.File): Promise<ProcessedAsset> {
    this.assertAudioFile(file);
    const outputName = `${randomUUID()}.mp3`;
    const outputPath = join(this.audioRoot, outputName);

    try {
      await this.probeAudio(file.path);
      await this.runProcess('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        file.path,
        '-vn',
        '-codec:a',
        'libmp3lame',
        '-b:a',
        '128k',
        '-ar',
        '44100',
        '-ac',
        '2',
        outputPath,
      ]);

      const probe = await this.probeAudio(outputPath);
      const fileStats = await stat(outputPath);
      const audioStream = probe.streams?.find(
        (stream) => stream.codec_type === 'audio',
      );
      const duration = Number(audioStream?.duration ?? probe.format?.duration);
      const bitrate = Number(audioStream?.bit_rate ?? probe.format?.bit_rate);

      return {
        absolutePath: outputPath,
        data: {
          kind: FileAssetKind.AUDIO,
          storagePath: this.toStoragePath(outputPath),
          originalName: file.originalname.slice(0, 255),
          mimeType: 'audio/mpeg',
          sizeBytes: fileStats.size,
          checksum: await this.checksum(outputPath),
        },
        durationSeconds:
          Number.isFinite(duration) && duration > 0
            ? Math.max(1, Math.round(duration))
            : undefined,
        bitrateKbps:
          Number.isFinite(bitrate) && bitrate > 0
            ? Math.max(1, Math.round(bitrate / 1000))
            : 128,
      };
    } catch (error) {
      await this.removeFile(outputPath);
      if (this.isMissingExecutable(error)) {
        throw new ServiceUnavailableException({
          code: 'FFMPEG_UNAVAILABLE',
          message: '服务器尚未安装 FFmpeg，暂时无法处理音频',
        });
      }
      if (
        error instanceof UnsupportedMediaTypeException ||
        error instanceof PayloadTooLargeException
      ) {
        throw error;
      }
      throw new UnprocessableEntityException({
        code: 'AUDIO_PROCESSING_FAILED',
        message: '音频无法识别或转码失败',
      });
    } finally {
      await this.removeFile(file.path);
    }
  }

  async processCover(file: Express.Multer.File): Promise<ProcessedAsset> {
    return this.processImage(file, {
      kind: FileAssetKind.COVER,
      outputRoot: this.coverRoot,
      maxDimension: 1200,
      maxBytes:
        this.getPositiveInteger('MAX_COVER_UPLOAD_MB', 10) * 1024 * 1024,
      tooLargeCode: 'COVER_TOO_LARGE',
      tooLargeLabel: '封面文件',
      unsupportedCode: 'UNSUPPORTED_COVER_TYPE',
      unsupportedMessage: '仅支持 JPG、PNG、WebP、GIF 和 AVIF 图片',
      failureCode: 'COVER_PROCESSING_FAILED',
      failureMessage: '封面图片无法识别或转换失败',
    });
  }

  async processAvatar(file: Express.Multer.File): Promise<ProcessedAsset> {
    return this.processImage(file, {
      kind: FileAssetKind.USER_AVATAR,
      outputRoot: this.avatarRoot,
      maxDimension: 512,
      maxBytes:
        this.getPositiveInteger('MAX_AVATAR_UPLOAD_MB', 1) * 1024 * 1024,
      tooLargeCode: 'AVATAR_TOO_LARGE',
      tooLargeLabel: '头像文件',
      unsupportedCode: 'UNSUPPORTED_AVATAR_TYPE',
      unsupportedMessage: '头像仅支持 JPG、PNG、WebP、GIF 和 AVIF 图片',
      failureCode: 'AVATAR_PROCESSING_FAILED',
      failureMessage: '头像图片无法识别或转换失败',
    });
  }

  async processArtistAvatar(file: Express.Multer.File): Promise<ProcessedAsset> {
    return this.processImage(file, {
      kind: FileAssetKind.ARTIST_AVATAR,
      outputRoot: this.avatarRoot,
      maxDimension: 512,
      maxBytes:
        this.getPositiveInteger('MAX_AVATAR_UPLOAD_MB', 1) * 1024 * 1024,
      tooLargeCode: 'ARTIST_AVATAR_TOO_LARGE',
      tooLargeLabel: '歌手头像文件',
      unsupportedCode: 'UNSUPPORTED_ARTIST_AVATAR_TYPE',
      unsupportedMessage: '歌手头像仅支持 JPG、PNG、WebP、GIF 和 AVIF 图片',
      failureCode: 'ARTIST_AVATAR_PROCESSING_FAILED',
      failureMessage: '歌手头像图片无法识别或转换失败',
    });
  }

  private async processImage(
    file: Express.Multer.File,
    options: {
      kind: FileAssetKind;
      outputRoot: string;
      maxDimension: number;
      maxBytes: number;
      tooLargeCode: string;
      tooLargeLabel: string;
      unsupportedCode: string;
      unsupportedMessage: string;
      failureCode: string;
      failureMessage: string;
    },
  ): Promise<ProcessedAsset> {
    this.assertImageFile(file, options);
    const outputName = `${randomUUID()}.webp`;
    const outputPath = join(options.outputRoot, outputName);

    try {
      const image = sharp(await readFile(file.path), { failOn: 'error' }).rotate().resize({
        width: options.maxDimension,
        height: options.maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      });
      const info = await image.webp({ quality: 82 }).toFile(outputPath);
      const fileStats = await stat(outputPath);

      return {
        absolutePath: outputPath,
        data: {
          kind: options.kind,
          storagePath: this.toStoragePath(outputPath),
          originalName: file.originalname.slice(0, 255),
          mimeType: 'image/webp',
          sizeBytes: fileStats.size,
          checksum: await this.checksum(outputPath),
          width: info.width,
          height: info.height,
        },
      };
    } catch (error) {
      await this.removeFile(outputPath);
      if (
        error instanceof UnsupportedMediaTypeException ||
        error instanceof PayloadTooLargeException
      ) {
        throw error;
      }
      throw new UnprocessableEntityException({
        code: options.failureCode,
        message: options.failureMessage,
      });
    } finally {
      await this.removeFile(file.path);
    }
  }

  resolveStoragePath(storagePath: string) {
    const absolutePath = resolve(this.mediaRoot, storagePath);
    const relativePath = relative(this.mediaRoot, absolutePath);
    if (
      !relativePath ||
      relativePath.startsWith(`..${sep}`) ||
      relativePath === '..' ||
      isAbsolute(relativePath)
    ) {
      throw new Error('Invalid media storage path');
    }
    return absolutePath;
  }

  async removeAssets(assets: Array<{ storagePath: string }>) {
    await Promise.all(
      assets.map((asset) =>
        this.removeFile(this.resolveStoragePath(asset.storagePath)),
      ),
    );
  }

  async cleanupUploadedFiles(files?: Record<string, Express.Multer.File[]>) {
    if (!files) return;
    await Promise.all(
      Object.values(files)
        .flat()
        .map((file) => this.removeFile(file.path)),
    );
  }

  private assertAudioFile(file: Express.Multer.File) {
    const extension = extname(file.originalname).toLowerCase();
    const maxBytes =
      this.getPositiveInteger('MAX_AUDIO_UPLOAD_MB', 50) * 1024 * 1024;

    if (file.size > maxBytes) {
      throw new PayloadTooLargeException({
        code: 'AUDIO_TOO_LARGE',
        message: `音频文件不能超过 ${Math.floor(maxBytes / 1024 / 1024)} MB`,
      });
    }
    if (
      !AUDIO_EXTENSIONS.has(extension) ||
      (!file.mimetype.startsWith('audio/') &&
        file.mimetype !== 'application/ogg' &&
        file.mimetype !== 'application/octet-stream')
    ) {
      throw new UnsupportedMediaTypeException({
        code: 'UNSUPPORTED_AUDIO_TYPE',
        message: '仅支持 MP3、M4A/AAC、OGG、WAV 和 FLAC 音频',
      });
    }
  }

  private assertImageFile(
    file: Express.Multer.File,
    options: {
      maxBytes: number;
      tooLargeCode: string;
      tooLargeLabel: string;
      unsupportedCode: string;
      unsupportedMessage: string;
    },
  ) {
    const extension = extname(file.originalname).toLowerCase();

    if (file.size > options.maxBytes) {
      throw new PayloadTooLargeException({
        code: options.tooLargeCode,
        message: `${options.tooLargeLabel}不能超过 ${Math.floor(options.maxBytes / 1024 / 1024)} MB`,
      });
    }
    if (
      !COVER_EXTENSIONS.has(extension) ||
      !file.mimetype.startsWith('image/')
    ) {
      throw new UnsupportedMediaTypeException({
        code: options.unsupportedCode,
        message: options.unsupportedMessage,
      });
    }
  }

  private async probeAudio(filePath: string) {
    const output = await this.runProcess('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration,bit_rate:stream=codec_type,duration,bit_rate',
      '-of',
      'json',
      filePath,
    ]);
    const result = JSON.parse(output) as AudioProbeResult;
    if (!result.streams?.some((stream) => stream.codec_type === 'audio')) {
      throw new Error('No audio stream found');
    }
    return result;
  }

  private runProcess(command: string, args: string[]) {
    return new Promise<string>((resolvePromise, rejectPromise) => {
      const child = spawn(command, args, {
        windowsHide: true,
        shell: false,
      });
      let stdout = '';
      let stderr = '';
      const timeout = setTimeout(
        () => {
          child.kill('SIGKILL');
          rejectPromise(new Error(`${command} timed out`));
        },
        this.getPositiveInteger('FFMPEG_TIMEOUT_MS', 120000),
      );

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr = `${stderr}${chunk.toString('utf8')}`.slice(-16000);
      });
      child.once('error', (error) => {
        clearTimeout(timeout);
        rejectPromise(error);
      });
      child.once('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolvePromise(stdout);
        } else {
          rejectPromise(
            new Error(`${command} exited with code ${code}: ${stderr}`),
          );
        }
      });
    });
  }

  private async checksum(filePath: string) {
    const digest = createHash('sha256');
    const stream = createReadStream(filePath);
    for await (const chunk of stream) {
      digest.update(chunk);
    }
    return digest.digest('hex');
  }

  private toStoragePath(absolutePath: string) {
    return relative(this.mediaRoot, absolutePath).split(sep).join('/');
  }

  private async removeFile(filePath: string) {
    await rm(filePath, { force: true }).catch(() => undefined);
  }

  private isMissingExecutable(error: unknown) {
    return (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    );
  }

  private getPositiveInteger(key: string, fallback: number) {
    const value = Number(
      this.configService.get<string | number>(key, fallback),
    );
    return Number.isSafeInteger(value) && value > 0 ? value : fallback;
  }
}
