import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuthModule } from '../auth/auth.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { MeController } from './me.controller.js';
import { MeService } from './me.service.js';

@Module({
  imports: [
    AuthModule,
    CatalogModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mediaRoot = resolve(
          configService.get<string>('MEDIA_ROOT', './uploads'),
        );
        const temporaryRoot = resolve(mediaRoot, 'tmp');
        mkdirSync(temporaryRoot, { recursive: true });
        const maxUploadMb = Number(
          configService.get<string | number>('MAX_AVATAR_UPLOAD_MB', 1),
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
            files: 1,
            fileSize:
              (Number.isFinite(maxUploadMb) && maxUploadMb > 0
                ? maxUploadMb
                : 1) *
              1024 *
              1024,
          },
        };
      },
    }),
  ],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
