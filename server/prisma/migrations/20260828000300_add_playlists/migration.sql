CREATE TABLE "playlists" (
    "id" UUID NOT NULL,
    "public_id" VARCHAR(64) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "cover_asset_id" UUID,
    "genre" VARCHAR(60),
    "mood" VARCHAR(60),
    "era" VARCHAR(60),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "playlist_songs" (
    "playlist_id" UUID NOT NULL,
    "song_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_songs_pkey" PRIMARY KEY ("playlist_id","song_id")
);

CREATE UNIQUE INDEX "playlists_public_id_key" ON "playlists"("public_id");
CREATE UNIQUE INDEX "playlists_cover_asset_id_key" ON "playlists"("cover_asset_id");
CREATE INDEX "playlists_is_published_created_at_idx" ON "playlists"("is_published", "created_at");
CREATE INDEX "playlists_title_idx" ON "playlists"("title");
CREATE UNIQUE INDEX "playlist_songs_playlist_id_position_key" ON "playlist_songs"("playlist_id", "position");
CREATE INDEX "playlist_songs_song_id_idx" ON "playlist_songs"("song_id");

ALTER TABLE "playlists" ADD CONSTRAINT "playlists_cover_asset_id_fkey" FOREIGN KEY ("cover_asset_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "playlist_songs" ADD CONSTRAINT "playlist_songs_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "playlist_songs" ADD CONSTRAINT "playlist_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
