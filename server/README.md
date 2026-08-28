# 悦音音乐后端

基于 NestJS、Prisma 和 PostgreSQL 的 API 服务，供用户音乐前台与独立管理后台共同使用。

当前已经完成数据库连接、真实用户鉴权、公开曲库、管理员曲库维护、文件上传、FFmpeg 转码、WebP 封面和 HTTP Range 播放。

## 推荐启动方式

在项目根目录执行：

```bash
npm run docker:up
```

启动完成后访问：

```text
http://localhost:3000/api/health
```

Compose 会先运行一次性 `migrate` 服务应用 Prisma migration，再启动 API。

首次启动或需要恢复演示曲库时，在项目根目录执行：

```bash
npm run docker:seed
```

Seed 会在 `media_data` 持久化卷中本地生成 20 首原创合成演示 MP3 和 WebP 封面，并向 PostgreSQL 导入 5 位歌手、10 张专辑、19 个分类和 12 个官方歌单。脚本可重复执行，不会下载外部网络歌曲。

停止服务：

```bash
npm run docker:down
```

## DBX 连接参数

```text
连接类型：PostgreSQL
主机：localhost
端口：5432
用户名：music_admin
密码：music_dev_password
数据库：music_site
```

这些是本地开发参数，正式部署时必须通过环境变量更换密码。
DBX 0.5.97 位于 `E:\DBX\dbx.exe`，仅用于查看数据和辅助排查；数据库结构变更统一使用 Prisma migration。

## 音频目录

Docker Compose 已配置持久化卷：

```text
media_data → /app/uploads
```

本机直接运行后端时使用 `server/uploads/`。上传文件、真实音频和数据库内容不会提交到 GitHub。

环境变量：

```text
MEDIA_ROOT=./uploads
MAX_AUDIO_UPLOAD_MB=50
MAX_COVER_UPLOAD_MB=10
REMOTE_AUDIO_HOSTS=
JWT_ACCESS_SECRET=replace-with-a-long-random-access-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-refresh-secret
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=604800
```

管理后台上传的音频会先校验格式，再通过 FFmpeg 转为 MP3，最终由 `/api/audio/:publicId` 提供 Range 流式播放；封面统一转为 WebP。

## 本机运行后端

先复制环境变量文件：

```powershell
Copy-Item .env.example .env
```

然后安装依赖并启动：

```bash
npm install
npm run prisma:migrate:deploy
npm run catalog:seed
npm run start:dev
```

本机执行 `catalog:seed` 需要系统已安装 FFmpeg；使用 `npm run docker:seed` 时由 Seed 镜像提供 FFmpeg。

连接本地 Docker PostgreSQL 运行端到端测试：

```bash
npm run test:e2e
```

## 鉴权接口

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

- 注册使用 `username`、`email` 和 `password`。
- 登录使用 `account`（用户名或邮箱）和 `password`。
- `/api/auth/me` 使用 `Authorization: Bearer <accessToken>`。
- 刷新与退出接口在请求体中接收 `refreshToken`。
- 密码使用 bcrypt 哈希，数据库只保存 Refresh Token 的 SHA-256 摘要。
