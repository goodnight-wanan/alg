# 悦音音乐

一个面向个人学习、开源展示和朋友间分享的全栈音乐网站，由 Vue 用户前台、独立 Vue 管理后台、NestJS API 和 PostgreSQL 数据库组成。

## 架构

```text
用户音乐前台（Vue） ─┐
                     ├─> NestJS API ─> PostgreSQL
管理后台（Vue） ─────┘             └> 音频 / 图片持久化目录
```

用户前台和管理后台共用同一个 API 与数据库，分布在同一仓库的两个分支：

| 分支 | 内容 |
|------|------|
| `vue-rewrite` | 用户音乐前台 |
| `admin-dashboard` | 管理后台 |

## 核心功能

- **用户前台**：浏览曲库、搜索、播放、收藏、歌单、播放历史和个人中心。
- **管理后台**：管理员登录，歌曲、歌手、专辑、分类的增删改查，音频上传、上下架与批量操作。
- **API**：统一鉴权（JWT Access + Refresh Token）、业务逻辑、文件上传和音频流式播放。
- **PostgreSQL**：保存用户、歌曲、歌单、收藏、播放历史等结构化数据。
- **音频**：本地文件由 FFmpeg 统一转成约 128 kbps MP3，也支持可信远程 URL。
- **歌词**：歌曲歌词展示页面待开发。

## 技术栈

| 分类 | 技术 | 用途 |
|------|------|------|
| 前端 | Vue 3、Vite、Vue Router 4、Pinia、Lenis | 用户前台与管理后台、平滑滚动 |
| 后端 | NestJS 11、Prisma 6.12、PostgreSQL 17 | API、ORM 与数据库 |
| 工具 | FFmpeg、sharp、Vitest | 音频转码、WebP 封面、测试 |
| 部署 | Docker Compose | 一键编排 API 与数据库 |

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
├── src/                      用户前台（Vue 3）
│   ├── api/                  后端接口封装（client 请求实例 / auth 认证 / catalog 曲库 / me 个人中心）
│   ├── components/           通用组件（PlayerBar 全局播放器、AppHeader 顶栏、Icon 图标等）
│   ├── router/               路由配置
│   ├── stores/               Pinia 状态（catalog 曲库 / player 播放器 / user 用户）
│   ├── styles/               全局样式
│   ├── utils/                工具函数（本地存储、通知、搜索历史等）
│   ├── views/                页面（首页/歌单/排行榜/歌手/新碟/搜索/登录注册/个人中心等 10+ 页面）
│   ├── App.vue               根组件
│   └── main.js               应用入口
├── server/                   NestJS API
│   ├── prisma/               数据库结构（schema.prisma 数据模型 + migrations 迁移）
│   ├── src/                  后端源码（auth 认证 / catalog 曲库 / me 个人中心 / users 用户 / database Prisma 连接）
│   ├── scripts/              脚本（seed-catalog 生成演示曲库 / promote-admin 提升管理员）
│   └── test/                 e2e 测试
├── compose.yaml              Docker 编排（PostgreSQL + API + 持久化卷）
└── 项目升级计划书.md  项目计划文档
```

管理后台在 `admin-dashboard` 分支维护，不在此目录。

## 开源说明

- 采用 MIT 许可证。
- 真实受版权保护的音频不随仓库发布，Seed 只生成原创合成演示音频。
- 上传目录、数据库数据和真实音频不提交到 GitHub。
