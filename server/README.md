# 悦音音乐后端

基于 NestJS、Prisma 和 PostgreSQL 的 API 服务，供用户音乐前台与计划中的管理后台共同使用。

当前阶段已经完成数据库连接和健康检查；鉴权、曲库、上传和管理接口将在后续阶段实现。

## 推荐启动方式

在项目根目录执行：

```bash
npm run docker:up
```

启动完成后访问：

```text
http://localhost:3000/api/health
```

停止服务：

```bash
npm run docker:down
```

## Navicat 连接参数

```text
连接类型：PostgreSQL
主机：localhost
端口：5432
用户名：music_admin
密码：music_dev_password
数据库：music_site
```

这些是本地开发参数，正式部署时必须通过环境变量更换密码。

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
```

后续管理后台上传的音频会先校验格式，再通过 FFmpeg 压缩，最终由 `/api/audio/:songId` 提供 Range 流式播放。

## 本机运行后端

先复制环境变量文件：

```powershell
Copy-Item .env.example .env
```

然后安装依赖并启动：

```bash
npm install
npm run start:dev
```
