ALTER TYPE "FileAssetKind" ADD VALUE 'USER_AVATAR';

ALTER TABLE "users" ADD COLUMN "avatar_asset_id" UUID;
ALTER TABLE "playlists" ADD COLUMN "owner_id" UUID;

CREATE TABLE "favorite_songs" (
    "user_id" UUID NOT NULL,
    "song_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_songs_pkey" PRIMARY KEY ("user_id","song_id")
);

CREATE TABLE "favorite_playlists" (
    "user_id" UUID NOT NULL,
    "playlist_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_playlists_pkey" PRIMARY KEY ("user_id","playlist_id")
);

CREATE TABLE "play_history" (
    "user_id" UUID NOT NULL,
    "song_id" UUID NOT NULL,
    "play_count" INTEGER NOT NULL DEFAULT 1,
    "first_played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "play_history_pkey" PRIMARY KEY ("user_id","song_id")
);

CREATE UNIQUE INDEX "users_avatar_asset_id_key" ON "users"("avatar_asset_id");
CREATE INDEX "playlists_owner_id_created_at_idx" ON "playlists"("owner_id", "created_at");
CREATE INDEX "favorite_songs_song_id_idx" ON "favorite_songs"("song_id");
CREATE INDEX "favorite_songs_user_id_created_at_idx" ON "favorite_songs"("user_id", "created_at");
CREATE INDEX "favorite_playlists_playlist_id_idx" ON "favorite_playlists"("playlist_id");
CREATE INDEX "favorite_playlists_user_id_created_at_idx" ON "favorite_playlists"("user_id", "created_at");
CREATE INDEX "play_history_song_id_idx" ON "play_history"("song_id");
CREATE INDEX "play_history_user_id_last_played_at_idx" ON "play_history"("user_id", "last_played_at");

ALTER TABLE "users" ADD CONSTRAINT "users_avatar_asset_id_fkey" FOREIGN KEY ("avatar_asset_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite_songs" ADD CONSTRAINT "favorite_songs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite_songs" ADD CONSTRAINT "favorite_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite_playlists" ADD CONSTRAINT "favorite_playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite_playlists" ADD CONSTRAINT "favorite_playlists_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
