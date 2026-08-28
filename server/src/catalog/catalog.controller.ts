import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { PaginationQueryDto } from './dto/catalog.dto.js';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('songs')
  listSongs(@Query() query: PaginationQueryDto) {
    return this.catalogService.listSongs(query);
  }

  @Get('songs/:publicId')
  getSong(@Param('publicId') publicId: string) {
    return this.catalogService.getSong(publicId);
  }

  @Get('artists')
  listArtists() {
    return this.catalogService.listArtists();
  }

  @Get('albums')
  listAlbums() {
    return this.catalogService.listAlbums();
  }

  @Get('categories')
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Get('playlists')
  listPlaylists() {
    return this.catalogService.listPlaylists();
  }

  @Get('playlists/:publicId')
  getPlaylist(@Param('publicId') publicId: string) {
    return this.catalogService.getPlaylist(publicId);
  }
}
