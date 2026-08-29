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
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  ChangePasswordDto,
  CreateUserPlaylistDto,
  MePaginationQueryDto,
  UpdateProfileDto,
  UpdateUserPlaylistDto,
} from './dto/me.dto.js';
import { MeService } from './me.service.js';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  profile(@Req() request: AuthenticatedRequest) {
    return this.meService.getProfile(request.user.id);
  }

  @Patch('profile')
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.meService.updateProfile(request.user.id, dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  updateAvatar(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.meService.updateAvatar(request.user.id, file);
  }

  @Patch('password')
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.meService.changePassword(request.user.id, dto);
  }

  @Get('favorite-songs')
  favoriteSongs(
    @Req() request: AuthenticatedRequest,
    @Query() query: MePaginationQueryDto,
  ) {
    return this.meService.listFavoriteSongs(request.user.id, query);
  }

  @Post('favorite-songs/:songId')
  addFavoriteSong(
    @Req() request: AuthenticatedRequest,
    @Param('songId') songId: string,
  ) {
    return this.meService.addFavoriteSong(request.user.id, songId);
  }

  @Delete('favorite-songs/:songId')
  removeFavoriteSong(
    @Req() request: AuthenticatedRequest,
    @Param('songId') songId: string,
  ) {
    return this.meService.removeFavoriteSong(request.user.id, songId);
  }

  @Get('favorite-playlists')
  favoritePlaylists(
    @Req() request: AuthenticatedRequest,
    @Query() query: MePaginationQueryDto,
  ) {
    return this.meService.listFavoritePlaylists(request.user.id, query);
  }

  @Post('favorite-playlists/:playlistId')
  addFavoritePlaylist(
    @Req() request: AuthenticatedRequest,
    @Param('playlistId') playlistId: string,
  ) {
    return this.meService.addFavoritePlaylist(request.user.id, playlistId);
  }

  @Delete('favorite-playlists/:playlistId')
  removeFavoritePlaylist(
    @Req() request: AuthenticatedRequest,
    @Param('playlistId') playlistId: string,
  ) {
    return this.meService.removeFavoritePlaylist(
      request.user.id,
      playlistId,
    );
  }

  @Get('playlists')
  playlists(@Req() request: AuthenticatedRequest) {
    return this.meService.listPlaylists(request.user.id);
  }

  @Post('playlists')
  createPlaylist(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateUserPlaylistDto,
  ) {
    return this.meService.createPlaylist(request.user.id, dto);
  }

  @Patch('playlists/:playlistId')
  updatePlaylist(
    @Req() request: AuthenticatedRequest,
    @Param('playlistId', new ParseUUIDPipe({ version: '4' }))
    playlistId: string,
    @Body() dto: UpdateUserPlaylistDto,
  ) {
    return this.meService.updatePlaylist(request.user.id, playlistId, dto);
  }

  @Delete('playlists/:playlistId')
  deletePlaylist(
    @Req() request: AuthenticatedRequest,
    @Param('playlistId', new ParseUUIDPipe({ version: '4' }))
    playlistId: string,
  ) {
    return this.meService.deletePlaylist(request.user.id, playlistId);
  }

  @Post('playlists/:playlistId/songs/:songId')
  addPlaylistSong(
    @Req() request: AuthenticatedRequest,
    @Param('playlistId', new ParseUUIDPipe({ version: '4' }))
    playlistId: string,
    @Param('songId') songId: string,
  ) {
    return this.meService.addPlaylistSong(
      request.user.id,
      playlistId,
      songId,
    );
  }

  @Delete('playlists/:playlistId/songs/:songId')
  removePlaylistSong(
    @Req() request: AuthenticatedRequest,
    @Param('playlistId', new ParseUUIDPipe({ version: '4' }))
    playlistId: string,
    @Param('songId') songId: string,
  ) {
    return this.meService.removePlaylistSong(
      request.user.id,
      playlistId,
      songId,
    );
  }

  @Get('history')
  history(
    @Req() request: AuthenticatedRequest,
    @Query() query: MePaginationQueryDto,
  ) {
    return this.meService.listHistory(request.user.id, query);
  }

  @Post('history/:songId')
  recordHistory(
    @Req() request: AuthenticatedRequest,
    @Param('songId') songId: string,
  ) {
    return this.meService.recordHistory(request.user.id, songId);
  }

  @Delete('history')
  clearHistory(@Req() request: AuthenticatedRequest) {
    return this.meService.clearHistory(request.user.id);
  }
}
