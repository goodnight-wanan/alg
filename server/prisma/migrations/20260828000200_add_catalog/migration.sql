-- CreateEnum
CREATE TYPE "SongSourceType" AS ENUM ('LOCAL', 'REMOTE');

-- CreateEnum
CREATE TYPE "SongStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "FileAssetKind" AS ENUM ('AUDIO', 'COVER', 'ARTIST_AVATAR');

-- CreateTable
CREATE TABLE "artists" (
    "id" UUID NOT NULL,
    "public_id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "biography" TEXT,
    "avatar_asset_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" UUID NOT NULL,
    "public_id" VARCHAR(64) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "artist_id" UUID NOT NULL,
    "cover_asset_id" UUID,
    "release_date" DATE,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" UUID NOT NULL,
    "public_id" VARCHAR(64) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "artist_id" UUID NOT NULL,
    "album_id" UUID,
    "source_type" "SongSourceType" NOT NULL,
    "remote_url" VARCHAR(2048),
    "audio_asset_id" UUID,
    "cover_asset_id" UUID,
    "duration_seconds" INTEGER,
    "bitrate_kbps" INTEGER,
    "status" "SongStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_categories" (
    "song_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "song_categories_pkey" PRIMARY KEY ("song_id","category_id")
);

-- CreateTable
CREATE TABLE "file_assets" (
    "id" UUID NOT NULL,
    "kind" "FileAssetKind" NOT NULL,
    "storage_path" VARCHAR(512) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum" CHAR(64) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artists_public_id_key" ON "artists"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "artists_avatar_asset_id_key" ON "artists"("avatar_asset_id");

-- CreateIndex
CREATE INDEX "artists_name_idx" ON "artists"("name");

-- CreateIndex
CREATE UNIQUE INDEX "albums_public_id_key" ON "albums"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "albums_cover_asset_id_key" ON "albums"("cover_asset_id");

-- CreateIndex
CREATE INDEX "albums_artist_id_idx" ON "albums"("artist_id");

-- CreateIndex
CREATE INDEX "albums_title_idx" ON "albums"("title");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "songs_public_id_key" ON "songs"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "songs_audio_asset_id_key" ON "songs"("audio_asset_id");

-- CreateIndex
CREATE INDEX "songs_artist_id_idx" ON "songs"("artist_id");

-- CreateIndex
CREATE INDEX "songs_album_id_idx" ON "songs"("album_id");

-- CreateIndex
CREATE INDEX "songs_status_created_at_idx" ON "songs"("status", "created_at");

-- CreateIndex
CREATE INDEX "songs_title_idx" ON "songs"("title");

-- CreateIndex
CREATE INDEX "song_categories_category_id_idx" ON "song_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_assets_storage_path_key" ON "file_assets"("storage_path");

-- CreateIndex
CREATE INDEX "file_assets_kind_idx" ON "file_assets"("kind");

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_avatar_asset_id_fkey" FOREIGN KEY ("avatar_asset_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_cover_asset_id_fkey" FOREIGN KEY ("cover_asset_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_audio_asset_id_fkey" FOREIGN KEY ("audio_asset_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_cover_asset_id_fkey" FOREIGN KEY ("cover_asset_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_categories" ADD CONSTRAINT "song_categories_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_categories" ADD CONSTRAINT "song_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
