-- 将特色标签「新碟」更名为「新歌」，slug 保持不变（feature-new）
UPDATE "categories" SET "name" = '新歌' WHERE "slug" = 'feature-new';
