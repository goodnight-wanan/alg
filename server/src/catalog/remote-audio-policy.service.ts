import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RemoteAudioPolicyService {
  constructor(private readonly configService: ConfigService) {}

  assertAllowed(value: string) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw this.notAllowed();
    }

    const hostname = url.hostname.toLowerCase();
    const allowed = this.allowedHosts().some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      !allowed
    ) {
      throw this.notAllowed();
    }
    return url;
  }

  private allowedHosts() {
    return this.configService
      .get<string>('REMOTE_AUDIO_HOSTS', '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);
  }

  private notAllowed() {
    return new BadRequestException({
      code: 'REMOTE_AUDIO_HOST_NOT_ALLOWED',
      message: '远程音频地址不在可信域名白名单中',
    });
  }
}
