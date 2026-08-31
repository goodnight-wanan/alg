import {
  FileAssetKind,
  PrismaClient,
  SongSourceType,
  SongStatus,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const prisma = new PrismaClient();
const mediaRoot = resolve(process.env.MEDIA_ROOT ?? './uploads');
const audioRoot = join(mediaRoot, 'audio');
const coverRoot = join(mediaRoot, 'covers');
const tempRoot = join(mediaRoot, 'tmp');
const force = process.env.SEED_FORCE === '1';

const categories = [
  ['genre', '流行', 'genre-pop'],
  ['genre', '轻音乐', 'genre-light'],
  ['genre', '电子音乐', 'genre-electronic'],
  ['genre', '爵士', 'genre-jazz'],
  ['genre', '民谣', 'genre-folk'],
  ['mood', '欢快', 'mood-happy'],
  ['mood', '治愈', 'mood-healing'],
  ['mood', '安静', 'mood-calm'],
  ['mood', '励志', 'mood-inspiring'],
  ['mood', '思念', 'mood-missing'],
  ['era', '20年代', 'era-2020s'],
  ['region', '内地', 'region-mainland'],
  ['region', '欧美', 'region-western'],
  ['region', '日本', 'region-japan'],
  ['region', '韩国', 'region-korea'],
  ['chart', '飙升榜', 'chart-rising'],
  ['chart', '热歌榜', 'chart-hot'],
  ['chart', '新歌榜', 'chart-new'],
  ['feature', '新歌', 'feature-new'],
].map(([group, name, slug]) => ({ group, name, slug }));

const artists = [
  {
    publicId: 'artist-cloud-signal',
    name: '云帆信号',
    region: '内地',
    biography: '由项目 Seed 生成的原创电子音乐组合，作品用于功能演示。',
  },
  {
    publicId: 'artist-north-shore-letter',
    name: '北岸来信',
    region: '内地',
    biography: '以温暖木吉他与轻柔旋律为灵感的虚构音乐人。',
  },
  {
    publicId: 'artist-neon-harbor',
    name: 'Neon Harbor',
    region: '欧美',
    biography: 'A fictional synth-pop project created for this demo catalog.',
  },
  {
    publicId: 'artist-forest-echo',
    name: '森屿回声',
    region: '日本',
    biography: '以自然、雨声与城市夜色为意象的虚构轻音乐企划。',
  },
  {
    publicId: 'artist-lunar-arcade',
    name: 'Lunar Arcade',
    region: '韩国',
    biography: 'A fictional dance and chillwave duo for interface demonstrations.',
  },
];

const albums = [
  ['album-pink-horizon', '粉色地平线', 'artist-cloud-signal', '#ff7eb3', '#7a5cff', '2026-08-01'],
  ['album-city-frequency', '城市频率', 'artist-cloud-signal', '#ff9966', '#ff5e62', '2026-06-14'],
  ['album-northbound', '向北的信', 'artist-north-shore-letter', '#4facfe', '#00f2fe', '2026-05-20'],
  ['album-window-light', '窗边微光', 'artist-north-shore-letter', '#f6d365', '#fda085', '2025-11-09'],
  ['album-after-midnight', 'After Midnight', 'artist-neon-harbor', '#30cfd0', '#330867', '2026-07-18'],
  ['album-blue-hour', 'Blue Hour', 'artist-neon-harbor', '#5ee7df', '#b490ca', '2025-09-12'],
  ['album-rain-map', '雨的地图', 'artist-forest-echo', '#89f7fe', '#66a6ff', '2026-04-02'],
  ['album-slow-island', '慢岛', 'artist-forest-echo', '#a8edea', '#fed6e3', '2025-12-21'],
  ['album-moon-game', 'Moon Game', 'artist-lunar-arcade', '#f093fb', '#f5576c', '2026-08-08'],
  ['album-soft-reset', 'Soft Reset', 'artist-lunar-arcade', '#43e97b', '#38f9d7', '2025-10-30'],
].map(([publicId, title, artistPublicId, colorA, colorB, releaseDate]) => ({
  publicId,
  title,
  artistPublicId,
  colorA,
  colorB,
  releaseDate,
  description: '项目内置原创合成器演示专辑，音频由 Seed 脚本本地生成。',
}));

const tracks = [
  ['seed-track-01', '晨光起航', 'artist-cloud-signal', 'album-pink-horizon', 'genre-electronic', 'mood-inspiring', 'region-mainland', 'chart-rising', true, 220, 108, 'major'],
  ['seed-track-02', '云层来信', 'artist-cloud-signal', 'album-pink-horizon', 'genre-light', 'mood-healing', 'region-mainland', 'chart-new', true, 246, 92, 'major'],
  ['seed-track-03', '霓虹心跳', 'artist-cloud-signal', 'album-city-frequency', 'genre-pop', 'mood-happy', 'region-mainland', 'chart-hot', true, 261, 122, 'major'],
  ['seed-track-04', '晚高峰漫游', 'artist-cloud-signal', 'album-city-frequency', 'genre-electronic', 'mood-calm', 'region-mainland', 'chart-rising', false, 196, 100, 'minor'],
  ['seed-track-05', '海风写下你', 'artist-north-shore-letter', 'album-northbound', 'genre-folk', 'mood-missing', 'region-mainland', 'chart-hot', true, 174, 84, 'major'],
  ['seed-track-06', '向北慢车', 'artist-north-shore-letter', 'album-northbound', 'genre-folk', 'mood-healing', 'region-mainland', 'chart-new', true, 196, 88, 'major'],
  ['seed-track-07', '窗边的星期日', 'artist-north-shore-letter', 'album-window-light', 'genre-light', 'mood-calm', 'region-mainland', 'chart-hot', false, 220, 76, 'major'],
  ['seed-track-08', '纸飞机没有终点', 'artist-north-shore-letter', 'album-window-light', 'genre-pop', 'mood-inspiring', 'region-mainland', 'chart-rising', false, 233, 96, 'major'],
  ['seed-track-09', 'Electric Coast', 'artist-neon-harbor', 'album-after-midnight', 'genre-electronic', 'mood-happy', 'region-western', 'chart-hot', true, 277, 124, 'minor'],
  ['seed-track-10', 'Last Train Glow', 'artist-neon-harbor', 'album-after-midnight', 'genre-pop', 'mood-missing', 'region-western', 'chart-new', true, 207, 104, 'minor'],
  ['seed-track-11', 'Velvet Street', 'artist-neon-harbor', 'album-blue-hour', 'genre-jazz', 'mood-calm', 'region-western', 'chart-hot', false, 185, 90, 'minor'],
  ['seed-track-12', 'Blue Hour Radio', 'artist-neon-harbor', 'album-blue-hour', 'genre-jazz', 'mood-healing', 'region-western', 'chart-rising', false, 196, 94, 'major'],
  ['seed-track-13', '雨停之前', 'artist-forest-echo', 'album-rain-map', 'genre-light', 'mood-missing', 'region-japan', 'chart-new', true, 220, 80, 'minor'],
  ['seed-track-14', '透明车站', 'artist-forest-echo', 'album-rain-map', 'genre-pop', 'mood-healing', 'region-japan', 'chart-rising', false, 246, 98, 'major'],
  ['seed-track-15', '慢岛午后', 'artist-forest-echo', 'album-slow-island', 'genre-light', 'mood-calm', 'region-japan', 'chart-hot', false, 174, 72, 'major'],
  ['seed-track-16', '星屑散步', 'artist-forest-echo', 'album-slow-island', 'genre-light', 'mood-happy', 'region-japan', 'chart-new', false, 261, 86, 'major'],
  ['seed-track-17', 'Pixel Moon', 'artist-lunar-arcade', 'album-moon-game', 'genre-electronic', 'mood-happy', 'region-korea', 'chart-hot', true, 293, 128, 'minor'],
  ['seed-track-18', 'Cherry Console', 'artist-lunar-arcade', 'album-moon-game', 'genre-pop', 'mood-inspiring', 'region-korea', 'chart-rising', false, 261, 118, 'major'],
  ['seed-track-19', 'Soft Reset', 'artist-lunar-arcade', 'album-soft-reset', 'genre-electronic', 'mood-healing', 'region-korea', 'chart-new', false, 207, 96, 'minor'],
  ['seed-track-20', 'Orbiting You', 'artist-lunar-arcade', 'album-soft-reset', 'genre-pop', 'mood-missing', 'region-korea', 'chart-hot', false, 233, 102, 'minor'],
].map(([
  publicId,
  title,
  artistPublicId,
  albumPublicId,
  genre,
  mood,
  region,
  chart,
  isNew,
  rootFrequency,
  tempo,
  mode,
], index) => ({
  publicId,
  title,
  artistPublicId,
  albumPublicId,
  categorySlugs: [genre, mood, 'era-2020s', region, chart, ...(isNew ? ['feature-new'] : [])],
  rootFrequency,
  tempo,
  mode,
  durationSeconds: 24 + (index % 4) * 2,
  publishedAt: new Date(Date.UTC(2026, 7, 28 - index)),
  index,
}));

const playlists = [
  ['playlist-morning-launch', '清晨启动器', '给新一天一段轻盈而明亮的开场。', '轻音乐', '励志', '20年代', '#ff9a9e', '#fad0c4', [1, 2, 6, 8, 12]],
  ['playlist-city-neon', '城市霓虹漫游', '适合通勤、夜跑和看城市灯光的电子节拍。', '电子音乐', '欢快', '20年代', '#a18cd1', '#fbc2eb', [3, 4, 9, 17, 18]],
  ['playlist-healing-island', '治愈慢岛', '把通知静音，给自己留一点不被打扰的时间。', '轻音乐', '治愈', '20年代', '#84fab0', '#8fd3f4', [2, 7, 12, 14, 15, 19]],
  ['playlist-missing-you', '写给想念的人', '温柔旋律里，藏着没能说出口的话。', '流行', '思念', '20年代', '#fccb90', '#d57eeb', [5, 10, 13, 20]],
  ['playlist-weekend-energy', '周末能量补给', '适合整理房间、散步和快乐摇摆。', '流行', '欢快', '20年代', '#f6d365', '#fda085', [1, 3, 9, 16, 17, 18]],
  ['playlist-focus-flow', '专注心流', '节奏稳定、不抢注意力的学习与工作背景乐。', '轻音乐', '安静', '20年代', '#cfd9df', '#e2ebf0', [4, 7, 11, 15, 19]],
  ['playlist-blue-jazz', '蓝色爵士街区', '晚灯、旧唱片与一杯慢慢变凉的咖啡。', '爵士', '安静', '20年代', '#667eea', '#764ba2', [10, 11, 12, 13]],
  ['playlist-northbound', '向北旅行歌单', '公路、海风和沿途不断后退的风景。', '民谣', '治愈', '20年代', '#4facfe', '#00f2fe', [5, 6, 8, 14, 16]],
  ['playlist-new-release', '本周新声', '收录悦音原创演示曲库中最近发布的作品。', '流行', '欢快', '20年代', '#fa709a', '#fee140', [1, 2, 3, 5, 6, 9, 10, 13, 17]],
  ['playlist-global-signals', '世界信号', '来自不同虚构音乐企划的跨地区声音拼图。', '电子音乐', '励志', '20年代', '#30cfd0', '#330867', [3, 6, 9, 12, 14, 17, 20]],
  ['playlist-soft-night', '柔软夜晚', '适合睡前、阅读和独处时循环播放。', '轻音乐', '安静', '20年代', '#a6c0fe', '#f68084', [2, 7, 11, 13, 15, 19, 20]],
  ['playlist-rising-pulse', '飙升脉冲', '节拍逐渐升温，保持前进的动力。', '电子音乐', '励志', '20年代', '#f093fb', '#f5576c', [1, 4, 8, 12, 14, 18]],
].map(([publicId, title, description, genre, mood, era, colorA, colorB, trackNumbers]) => ({
  publicId,
  title,
  description,
  genre,
  mood,
  era,
  colorA,
  colorB,
  trackPublicIds: trackNumbers.map((number) => `seed-track-${String(number).padStart(2, '0')}`),
}));

function run(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { shell: false, windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr = `${stderr}${chunk.toString('utf8')}`.slice(-12000);
    });
    child.once('error', rejectPromise);
    child.once('close', (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`${command} exited with ${code}: ${stderr}`));
    });
  });
}

function createWav(track) {
  const sampleRate = 22050;
  const channels = 2;
  const bitsPerSample = 16;
  const sampleCount = track.durationSeconds * sampleRate;
  const dataSize = sampleCount * channels * 2;
  const buffer = Buffer.allocUnsafe(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const scale = track.mode === 'minor'
    ? [1, 6 / 5, 4 / 3, 3 / 2, 9 / 5, 2]
    : [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];
  const stepSeconds = 30 / track.tempo;
  const pattern = [0, 2, 4, 3, 1, 3, 5, 4, 2, 1, 3, 0, 4, 2, 5, 3];
  const seed = track.index + 1;

  for (let sample = 0; sample < sampleCount; sample += 1) {
    const time = sample / sampleRate;
    const step = Math.floor(time / stepSeconds);
    const phase = (time % stepSeconds) / stepSeconds;
    const note = pattern[(step + seed * 3) % pattern.length];
    const melodyFrequency = track.rootFrequency * scale[note];
    const envelope = Math.min(1, phase * 10) * Math.min(1, (1 - phase) * 4);
    const melody =
      Math.sin(Math.PI * 2 * melodyFrequency * time) * 0.18 * envelope +
      Math.sin(Math.PI * 4 * melodyFrequency * time) * 0.04 * envelope;
    const bassFrequency = track.rootFrequency / 2 * scale[(step >> 2) % 4];
    const bass = Math.sin(Math.PI * 2 * bassFrequency * time) * 0.11;
    const pad =
      (Math.sin(Math.PI * 2 * track.rootFrequency * time) +
        Math.sin(Math.PI * 2 * track.rootFrequency * 1.25 * time) +
        Math.sin(Math.PI * 2 * track.rootFrequency * 1.5 * time)) *
      0.035;
    const beatPhase = (time * track.tempo / 60) % 1;
    const kick = Math.sin(Math.PI * 2 * (52 + 28 * (1 - beatPhase)) * time) * Math.exp(-beatPhase * 18) * 0.16;
    const shimmer = Math.sin(Math.PI * 2 * (melodyFrequency * 2.01) * time) * 0.018;
    const fade = Math.min(1, time / 1.2, (track.durationSeconds - time) / 1.5);
    const base = (melody + bass + pad + kick + shimmer) * Math.max(0, fade);
    const pan = Math.sin(time * 0.35 + seed) * 0.08;
    const left = Math.max(-1, Math.min(1, base * (1 - pan)));
    const right = Math.max(-1, Math.min(1, base * (1 + pan)));
    const offset = 44 + sample * 4;
    buffer.writeInt16LE(Math.round(left * 32767), offset);
    buffer.writeInt16LE(Math.round(right * 32767), offset + 2);
  }
  return buffer;
}

async function checksum(path) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest('hex');
}

function coverSvg(colorA, colorB, seed) {
  const offset = 90 + (seed * 37) % 340;
  const radius = 110 + (seed * 17) % 120;
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${colorA}"/>
          <stop offset="1" stop-color="${colorB}"/>
        </linearGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="32"/></filter>
      </defs>
      <rect width="720" height="720" fill="url(#g)"/>
      <circle cx="${offset}" cy="210" r="${radius}" fill="rgba(255,255,255,.28)" filter="url(#blur)"/>
      <circle cx="${720 - offset / 2}" cy="540" r="${radius * 0.8}" fill="rgba(255,255,255,.18)"/>
      <path d="M70 520 C180 390 300 620 430 430 S650 350 700 250" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="18" stroke-linecap="round"/>
      <g fill="rgba(255,255,255,.88)">
        <circle cx="150" cy="140" r="9"/><circle cx="188" cy="112" r="5"/><circle cx="590" cy="155" r="7"/>
        <circle cx="540" cy="610" r="6"/><circle cx="610" cy="565" r="4"/>
      </g>
    </svg>
  `);
}

async function ensureAudio(track) {
  const storagePath = `audio/${track.publicId}.mp3`;
  const outputPath = join(mediaRoot, storagePath);
  if (force || !(await exists(outputPath))) {
    const inputPath = join(tempRoot, `${track.publicId}.wav`);
    await writeFile(inputPath, createWav(track));
    try {
      await run('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath,
        '-vn', '-codec:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '2', outputPath,
      ]);
    } finally {
      await rm(inputPath, { force: true });
    }
  }
  const fileStats = await stat(outputPath);
  return prisma.fileAsset.upsert({
    where: { storagePath },
    update: {
      originalName: `${track.publicId}.wav`, mimeType: 'audio/mpeg', sizeBytes: fileStats.size,
      checksum: await checksum(outputPath), kind: FileAssetKind.AUDIO,
    },
    create: {
      storagePath, originalName: `${track.publicId}.wav`, mimeType: 'audio/mpeg', sizeBytes: fileStats.size,
      checksum: await checksum(outputPath), kind: FileAssetKind.AUDIO,
    },
  });
}

async function ensureCover(publicId, colorA, colorB, seed) {
  const storagePath = `covers/${publicId}.webp`;
  const outputPath = join(mediaRoot, storagePath);
  if (force || !(await exists(outputPath))) {
    await sharp(coverSvg(colorA, colorB, seed)).webp({ quality: 84 }).toFile(outputPath);
  }
  const metadata = await sharp(outputPath).metadata();
  const fileStats = await stat(outputPath);
  return prisma.fileAsset.upsert({
    where: { storagePath },
    update: {
      originalName: `${publicId}.svg`, mimeType: 'image/webp', sizeBytes: fileStats.size,
      checksum: await checksum(outputPath), width: metadata.width, height: metadata.height,
      kind: FileAssetKind.COVER,
    },
    create: {
      storagePath, originalName: `${publicId}.svg`, mimeType: 'image/webp', sizeBytes: fileStats.size,
      checksum: await checksum(outputPath), width: metadata.width, height: metadata.height,
      kind: FileAssetKind.COVER,
    },
  });
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function seed() {
  await Promise.all([mkdir(audioRoot, { recursive: true }), mkdir(coverRoot, { recursive: true }), mkdir(tempRoot, { recursive: true })]);

  const categoryBySlug = new Map();
  for (const category of categories) {
    const type = category.group.toUpperCase();
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: `${category.group} 分类`,
        type,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: `${category.group} 分类`,
        type,
      },
    });
    categoryBySlug.set(record.slug, record);
  }

  const artistByPublicId = new Map();
  for (const artist of artists) {
    const record = await prisma.artist.upsert({
      where: { publicId: artist.publicId },
      update: {
        name: artist.name,
        biography: artist.biography,
        region: artist.region,
      },
      create: {
        publicId: artist.publicId,
        name: artist.name,
        biography: artist.biography,
        region: artist.region,
      },
    });
    artistByPublicId.set(record.publicId, record);
  }

  const albumByPublicId = new Map();
  for (const [index, album] of albums.entries()) {
    const cover = await ensureCover(album.publicId, album.colorA, album.colorB, index + 1);
    const artist = artistByPublicId.get(album.artistPublicId);
    const record = await prisma.album.upsert({
      where: { publicId: album.publicId },
      update: {
        title: album.title, artistId: artist.id, coverAssetId: cover.id,
        releaseDate: new Date(`${album.releaseDate}T00:00:00.000Z`), description: album.description,
      },
      create: {
        publicId: album.publicId, title: album.title, artistId: artist.id, coverAssetId: cover.id,
        releaseDate: new Date(`${album.releaseDate}T00:00:00.000Z`), description: album.description,
      },
    });
    albumByPublicId.set(record.publicId, record);
  }

  const songByPublicId = new Map();
  for (const track of tracks) {
    const artist = artistByPublicId.get(track.artistPublicId);
    const album = albumByPublicId.get(track.albumPublicId);
    const audio = await ensureAudio(track);
    const categoryIds = track.categorySlugs.map((slug) => categoryBySlug.get(slug).id);
    const categoryCreate = categoryIds.map((categoryId) => ({ categoryId }));
    const record = await prisma.song.upsert({
      where: { publicId: track.publicId },
      update: {
        title: track.title, artistId: artist.id, albumId: album.id,
        sourceType: SongSourceType.LOCAL, remoteUrl: null, audioAssetId: audio.id,
        coverAssetId: null, durationSeconds: track.durationSeconds, bitrateKbps: 128,
        status: SongStatus.PUBLISHED, publishedAt: track.publishedAt,
        categories: { deleteMany: {}, create: categoryCreate },
      },
      create: {
        publicId: track.publicId, title: track.title, artistId: artist.id, albumId: album.id,
        sourceType: SongSourceType.LOCAL, audioAssetId: audio.id,
        durationSeconds: track.durationSeconds, bitrateKbps: 128,
        status: SongStatus.PUBLISHED, publishedAt: track.publishedAt,
        categories: { create: categoryCreate },
      },
    });
    songByPublicId.set(record.publicId, record);
    console.log(`Seeded ${track.publicId} (${track.index + 1}/${tracks.length})`);
  }

  for (const [index, playlist] of playlists.entries()) {
    const cover = await ensureCover(playlist.publicId, playlist.colorA, playlist.colorB, index + 41);
    const record = await prisma.playlist.upsert({
      where: { publicId: playlist.publicId },
      update: {
        title: playlist.title, description: playlist.description, coverAssetId: cover.id,
        genre: playlist.genre, mood: playlist.mood, era: playlist.era, isPublished: true,
      },
      create: {
        publicId: playlist.publicId, title: playlist.title, description: playlist.description,
        coverAssetId: cover.id, genre: playlist.genre, mood: playlist.mood,
        era: playlist.era, isPublished: true,
      },
    });
    await prisma.playlistSong.deleteMany({ where: { playlistId: record.id } });
    await prisma.playlistSong.createMany({
      data: playlist.trackPublicIds.map((publicId, position) => ({
        playlistId: record.id,
        songId: songByPublicId.get(publicId).id,
        position: position + 1,
      })),
    });
  }

  const [songCount, playlistCount] = await Promise.all([
    prisma.song.count({ where: { publicId: { startsWith: 'seed-track-' }, status: SongStatus.PUBLISHED } }),
    prisma.playlist.count({ where: { publicId: { startsWith: 'playlist-' }, isPublished: true } }),
  ]);
  console.log(`Catalog seed complete: ${songCount} published songs, ${playlistCount} playlists.`);
}

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
