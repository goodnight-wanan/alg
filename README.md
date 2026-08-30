# 悦音音乐

一个面向个人学习、开源展示和朋友间分享的全栈音乐网站，由 Vue 用户前台、独立 Vue 管理后台、NestJS API 和 PostgreSQL 数据库组成。

## 架构

```text
用户音乐前台（Vue） ─┐
                     ├─> NestJS API ─> PostgreSQL
管理后台（Vue） ─────┘             └> 音频 / 图片持久化目录
```

用户前台和管理后台共用同一个 API 与数据库，分布在同一仓库的两个分支：

| 分支 | 内容 | 本地目录 |
|------|------|----------|
| `vue-rewrite` | 用户音乐前台 | `E:\Web\new music website` |
| `admin-dashboard` | 管理后台 | `E:\Web\admin-dashboard` |

## 核心功能

- **用户前台**：浏览曲库、搜索、播放、收藏、歌单、播放历史和个人中心。
- **管理后台**：管理员登录，歌曲、歌手、专辑、分类的增删改查，音频上传、上下架与批量操作。
- **API**：统一鉴权（JWT Access + Refresh Token）、业务逻辑、文件上传和音频流式播放。
- **PostgreSQL**：保存用户、歌曲、歌单、收藏、播放历史等结构化数据。
- **音频**：本地文件由 FFmpeg 统一转成约 128 kbps MP3，也支持可信远程 URL。

## 技术栈

- 前端：Vue 3、Vite、Vue Router 4、Pinia
- 后端：NestJS 11、Prisma 6.12、PostgreSQL 17
- 工具：FFmpeg（音频转码）、sharp（WebP 封面）、Vitest（测试）
- 部署：Docker Compose

## 快速开始

### 用户前台

```bash
npm install
npm run dev
```

访问 http://localhost:5173。

### API 与数据库

先启动 Docker Desktop，然后：

```bash
npm run docker:up
```

健康检查：http://localhost:3000/api/health

导入演示曲库（本地生成 20 首原创合成音频）：

```bash
npm run docker:seed
```

## 目录结构

```text
├── src/                  用户前台（Vue）
├── server/               NestJS API
│   ├── prisma/           数据库结构（schema + migration）
│   ├── src/              后端源码
│   └── scripts/          Seed 与管理脚本
├── compose.yaml          API、PostgreSQL、持久化卷编排
└── 补全音乐网站功能项目计划.md
```

管理后台不在此目录，位于同级 worktree `E:\Web\admin-dashboard`。

## 开源说明

- 采用 MIT 许可证。
- 真实受版权保护的音频不随仓库发布，Seed 只生成原创合成演示音频。
- 上传目录、数据库数据和真实音频不提交到 GitHub。
