import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RemoteAudioPolicyService } from './remote-audio-policy.service.js';

describe('RemoteAudioPolicyService', () => {
  const configService = {
    get: vi.fn().mockReturnValue('cdn.example.com,audio.example.org'),
  } as unknown as ConfigService;
  const service = new RemoteAudioPolicyService(configService);

  it('allows configured HTTPS hosts and their subdomains', () => {
    expect(
      service.assertAllowed('https://cdn.example.com/song.mp3').hostname,
    ).toBe('cdn.example.com');
    expect(
      service.assertAllowed('https://media.audio.example.org/song.mp3')
        .hostname,
    ).toBe('media.audio.example.org');
  });

  it('rejects credentials and hosts outside the whitelist', () => {
    expect(() =>
      service.assertAllowed('https://user:secret@cdn.example.com/song.mp3'),
    ).toThrow(BadRequestException);
    expect(() => service.assertAllowed('http://127.0.0.1/audio.mp3')).toThrow(
      BadRequestException,
    );
  });
});
