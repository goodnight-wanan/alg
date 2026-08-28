import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuthModule } from '../auth/auth.module.js';
import { AdminCatalogController } from './admin-catalog.controller.js';
import { AdminCatalogService } from './admin-catalog.service.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';
import { UploadCleanupInterceptor } from './interceptors/upload-cleanup.interceptor.js';
import { MediaStorageService } from './media-storage.service.js';
import { MediaController } from './media.controller.js';
import { RemoteAudioPolicyService } from './remote-audio-policy.service.js';

@Module({
  imports: [
    AuthModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mediaRoot = resolve(
          configService.get<string>('MEDIA_ROOT', './uploads'),
        );
        const temporaryRoot = resolve(mediaRoot, 'tmp');
        mkdirSync(temporaryRoot, { recursive: true });
        const maxUploadMb = Number(
          configService.get<string | number>('MAX_AUDIO_UPLOAD_MB', 50),
        );

        return {
          storage: diskStorage({
            destination: temporaryRoot,
            filename: (_request, file, callback) => {
              callback(
                null,
                `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
              );
            },
          }),
          limits: {
            files: 2,
            fileSize:
              (Number.isFinite(maxUploadMb) && maxUploadMb > 0
                ? maxUploadMb
                : 50) *
              1024 *
              1024,
          },
        };
      },
    }),
  ],
  controllers: [CatalogController, AdminCatalogController, MediaController],
  providers: [
    CatalogService,
    AdminCatalogService,
    MediaStorageService,
    RemoteAudioPolicyService,
    UploadCleanupInterceptor,
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
