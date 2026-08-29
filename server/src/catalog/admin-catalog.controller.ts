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
import type {
  UploadedAlbumFiles,
  UploadedArtistFiles,
  UploadedSongFiles,
} from './catalog.types.js';
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
  UpdateAlbumDto,
  UpdateArtistDto,
  UpdateCategoryDto,
} from './dto/catalog.dto.js';
import { UploadCleanupInterceptor } from './interceptors/upload-cleanup.interceptor.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCatalogController {
  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  @Get('stats')
  getStats() {
    return this.adminCatalogService.getStats();
  }

  @Get('songs')
  listSongs(@Query() query: AdminSongQueryDto) {
    return this.adminCatalogService.listSongs(query);
  }

  @Post('artists')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'avatar', maxCount: 1 }]),
    UploadCleanupInterceptor,
  )
  createArtist(
    @Body() dto: CreateArtistDto,
    @UploadedFiles() files: UploadedArtistFiles,
  ) {
    return this.adminCatalogService.createArtist(dto, files ?? {});
  }

  @Patch('artists/:id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'avatar', maxCount: 1 }]),
    UploadCleanupInterceptor,
  )
  updateArtist(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateArtistDto,
    @UploadedFiles() files: UploadedArtistFiles,
  ) {
    return this.adminCatalogService.updateArtist(id, dto, files ?? {});
  }

  @Delete('artists/:id')
  deleteArtist(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.adminCatalogService.deleteArtist(id);
  }

  @Post('albums')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }]),
    UploadCleanupInterceptor,
  )
  createAlbum(
    @Body() dto: CreateAlbumDto,
    @UploadedFiles() files: UploadedAlbumFiles,
  ) {
    return this.adminCatalogService.createAlbum(dto, files ?? {});
  }

  @Patch('albums/:id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }]),
    UploadCleanupInterceptor,
  )
  updateAlbum(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAlbumDto,
    @UploadedFiles() files: UploadedAlbumFiles,
  ) {
    return this.adminCatalogService.updateAlbum(id, dto, files ?? {});
  }

  @Delete('albums/:id')
  deleteAlbum(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.adminCatalogService.deleteAlbum(id);
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminCatalogService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminCatalogService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.adminCatalogService.deleteCategory(id);
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
