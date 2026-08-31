-- CreateTable
CREATE TABLE "playlist_categories" (
    "playlist_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_categories_pkey" PRIMARY KEY ("playlist_id","category_id")
);

-- CreateIndex
CREATE INDEX "playlist_categories_category_id_idx" ON "playlist_categories"("category_id");

-- AddForeignKey
ALTER TABLE "playlist_categories" ADD CONSTRAINT "playlist_categories_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "playlist_categories" ADD CONSTRAINT "playlist_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
