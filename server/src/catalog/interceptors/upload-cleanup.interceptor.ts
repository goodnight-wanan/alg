import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, finalize } from 'rxjs';
import { MediaStorageService } from '../media-storage.service.js';

@Injectable()
export class UploadCleanupInterceptor implements NestInterceptor {
  constructor(private readonly mediaStorage: MediaStorageService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      files?: Record<string, Express.Multer.File[]>;
    }>();

    return next.handle().pipe(
      finalize(() => {
        void this.mediaStorage.cleanupUploadedFiles(request.files);
      }),
    );
  }
}
