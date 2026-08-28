import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AdminCatalogService } from './admin-catalog.service.js';
import type { UploadedSongFiles } from './catalog.types.js';
import {
  AdminSongQueryDto,
  BatchSongIdsDto,
  BatchSongStatusDto,
  CreateAlbumDto,
  CreateArtistDto,
  CreateCategoryDto,
  CreateRemoteSongDto,
  UpdateSongDto,
  UpdateSongStatusDto,
  UploadSongDto,
} from './dto/catalog.dto.js';
import { UploadCleanupInterceptor } from './interceptors/upload-cleanup.interceptor.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCatalogController {
  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  @Get('songs')
  listSongs(@Query() query: AdminSongQueryDto) {
    return this.adminCatalogService.listSongs(query);
  }

  @Post('artists')
  createArtist(@Body() dto: CreateArtistDto) {
    return this.adminCatalogService.createArtist(dto);
  }

  @Post('albums')
  createAlbum(@Body() dto: CreateAlbumDto) {
    return this.adminCatalogService.createAlbum(dto);
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminCatalogService.createCategory(dto);
  }

  @Post('songs')
  createRemoteSong(@Body() dto: CreateRemoteSongDto) {
    return this.adminCatalogService.createRemoteSong(dto);
  }

  @Post('songs/upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'audio', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
    UploadCleanupInterceptor,
  )
  uploadSong(
    @Body() dto: UploadSongDto,
    @UploadedFiles() files: UploadedSongFiles,
  ) {
    return this.adminCatalogService.uploadSong(dto, files ?? {});
  }

  @Patch('songs/batch/status')
  updateManySongStatuses(@Body() dto: BatchSongStatusDto) {
    return this.adminCatalogService.updateManySongStatuses(dto);
  }

  @Delete('songs/batch')
  deleteManySongs(@Body() dto: BatchSongIdsDto) {
    return this.adminCatalogService.deleteManySongs(dto.ids);
  }

  @Patch('songs/:id/status')
  updateSongStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateSongStatusDto,
  ) {
    return this.adminCatalogService.updateSongStatus(id, dto);
  }

  @Patch('songs/:id')
  updateSong(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateSongDto,
  ) {
    return this.adminCatalogService.updateSong(id, dto);
  }

  @Delete('songs/:id')
  deleteSong(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.adminCatalogService.deleteSong(id);
  }
}
