# 悦音音乐

一个面向个人学习、开源展示和朋友间分享的全栈音乐网站项目。

项目由 Vue 用户前台、独立 Vue 管理后台、NestJS API 和 PostgreSQL 数据库组成。目标不是大型商业平台，而是完成一套可以自行维护曲库、上传音频、管理数据并部署上线的小型音乐系统。

## 项目架构

```text
用户音乐前台（Vue） ─┐
                     ├─> NestJS API ─> PostgreSQL
管理后台（Vue） ─────┘             └> 持久化音频 / 图片目录
```

- 用户前台：音乐浏览、搜索、播放、收藏、歌单和个人中心。
- 管理后台：管理员登录、歌曲上传、曲库维护、用户与站点数据管理。
- API：统一负责鉴权、业务逻辑、文件上传和音频流式播放。
- PostgreSQL：保存用户、歌曲、歌单、收藏和播放历史等结构化数据。
- 音频目录：保存实际音频文件，不把大文件写进数据库或 GitHub。

用户音乐网站与管理后台属于同一 GitHub 仓库，但使用不同分支和同级 worktree：

```text
E:\Web\new music website  → vue-rewrite
E:\Web\admin-dashboard    → admin-dashboard
```

## 当前状态

### 已完成

- 首页、歌单分类、歌单详情、排行榜、新碟、歌手和搜索页面。
- 登录、注册、我的音乐、个人中心和 404 页面。
- 全局播放器、播放队列、播放模式、音量、进度拖动和 Media Session。
- 收藏歌曲、收藏歌单、自建歌单、播放历史和搜索历史的前端 Mock 流程。
- WebP 头像上传、密码修改前端验证码和退出登录。
- 响应式桌面端、平板和移动端布局。
- NestJS + Prisma + PostgreSQL 后端基础环境。
- Docker Compose、数据库健康检查和 DBX 本地连接参数。
- 真实用户注册、用户名或邮箱登录、JWT Access Token 与 Refresh Token 轮换。
- 当前用户接口、退出登录、账号状态校验和管理员角色守卫。
- 歌手、专辑、分类、歌曲和文件资产模型及 Prisma migration。
- 公开曲库接口、管理员歌曲维护接口、本地上传、FFmpeg 转 MP3、WebP 封面和 HTTP Range 播放。
- 独立管理后台的登录、录入、上传、搜索、筛选、编辑、试听、上下架、删除与批量操作。
- 可重复执行的曲库 Seed：本地生成 20 首原创合成演示音频、5 位歌手、10 张专辑、19 个分类和 12 个官方歌单。
- 用户前台首页、歌单、歌手、新碟、排行榜、搜索和播放器已经迁移到真实曲库 API。
- 用户前台注册、登录、Token 自动刷新、退出和当前用户状态已经迁移到真实鉴权 API。
- 收藏歌曲、收藏歌单、用户歌单和播放历史已经持久化到 PostgreSQL。
- 个人昵称、WebP 头像和密码修改已经迁移到真实 API；改密后会撤销 Refresh Token 并要求重新登录。
- 曲库加载、空状态、失败重试、分页、搜索和音频不可用提示。
- 后端单元测试、端到端测试、构建和生产依赖安全审计。

### 尚未完成

- 生产部署、HTTPS、日志轮转和数据库备份。
- 生产环境初始化说明和演示账号整理。

## 技术栈

### 用户前台

- Vue 3
- Vite
- Vue Router 4
- Pinia
- HTML5 / CSS3
- SVG 图标组件

### 后端

- NestJS 11
- Prisma 6.12
- PostgreSQL 17
- Vitest
- Docker Compose

### 工程工具

- ESLint
- Oxlint
- Prettier
- sharp
- DBX 0.5.97（`E:\DBX\dbx.exe`，本地数据库查看与辅助排查）

## 音频方案

网站最终同时支持两类音频：

- `LOCAL`：管理员通过管理后台上传，保存在服务器持久化目录。
- `REMOTE`：数据库保存可信网络音频 URL。

初始曲库目标不少于 20 首可正常播放且允许使用的歌曲。上传的 WAV、FLAC、M4A、OGG 或 MP3 将由后端使用 FFmpeg 统一转换为约 128 kbps 的 MP3，在兼容浏览器的同时减少磁盘和流量占用。

20 首平均 4 分钟的 128 kbps 音频大约占 75 MB，实际目标控制在约 60–100 MB。

```text
Docker 音频目录：/app/uploads
Docker 持久化卷：media_data
本机后端目录：server/uploads/
默认上传限制：50 MB / 文件
```

真实音频、上传目录和数据库文件不会提交到 GitHub。请仅使用自己拥有权利、获得授权或允许公开分发的音频。

## 快速开始

### 1. 启动用户前台

```bash
npm install
npm run dev
```

Vite 默认开发地址：

```text
http://localhost:5173
```

### 2. 启动 API 和 PostgreSQL

先启动 Docker Desktop，然后在项目根目录执行：

```bash
npm run docker:up
```

健康检查：

```text
http://localhost:3000/api/health
```

查看 API 日志：

```bash
npm run docker:logs
```

停止服务：

```bash
npm run docker:down
```

`docker:down` 不会删除 PostgreSQL 和音频持久化卷。需要清空数据时必须明确执行带卷删除的 Docker 命令，避免误删开发数据。

## DBX 连接

本地开发数据库连接参数：

```text
连接类型：PostgreSQL
主机：localhost
端口：5432
用户名：music_admin
密码：music_dev_password
数据库：music_site
```

这些参数只用于本地开发，部署上线时必须通过环境变量更换密码。
DBX 仅用于查看数据和辅助排查；数据库结构变更统一通过 Prisma schema 与 migration 完成。

## 常用命令

```bash
# 用户前台
npm run dev
npm run lint
npm run build

# 后端
npm run server:dev
npm run server:build
npm run server:test
npm run server:test:e2e

# Docker
npm run docker:up
npm run docker:seed
npm run docker:logs
npm run docker:down
```

后端单独运行前，在 `server/` 中复制环境变量并安装依赖：

```powershell
Copy-Item .env.example .env
npm install
npm run start:dev
```

## 目录结构

```text
├── public/                   前端公开静态资源和演示音频
├── server/                   NestJS + Prisma API
│   ├── prisma/               Prisma 数据库结构
│   ├── src/                  后端源码
│   ├── uploads/              本机上传目录，不进入 Git
│   └── Dockerfile
├── src/                      当前 Vue 用户前台
│   ├── components/           通用组件
│   ├── api/                  前端 API 请求层
│   ├── data/                 后端曲库数据规范化与兼容查询
│   ├── router/               路由配置
│   ├── stores/               Pinia 用户、播放器和曲库状态
│   ├── styles/               全局与页面样式
│   ├── utils/                通用工具
│   └── views/                页面组件
├── compose.yaml              API、PostgreSQL 和持久化卷编排
├── index.html                Vite 页面入口
├── 补全音乐网站功能项目计划.md  精简开发上下文与阶段计划
└── vite.config.js
```

管理后台不在此目录内，位于同级 worktree `E:\Web\admin-dashboard`。

`admin/` 和 `server/uploads/` 是规划目录，当前仓库可能尚未创建实际内容。

## 后续路线

1. 歌手、专辑、歌曲、分类和文件数据模型。（已完成）
2. Vue 管理后台、歌曲上传、FFmpeg 压缩和上下架管理。（已完成）
3. 生成 20 首原创演示音频并迁移前台曲库。（已完成）
4. 收藏、用户歌单、播放历史、前台鉴权和个人资料后端持久化。（已完成）
5. 个人服务器部署、HTTPS、备份和开源整理。

完整阶段说明与验收标准见 `补全音乐网站功能项目计划.md`。

## 验证状态

截至 2026 年 8 月 29 日：

- 前端 `npm run lint` 通过。
- 前端 `npm run build` 通过。
- 后端 Prisma schema 校验通过。
- 首份用户与刷新令牌 migration 已应用到 Docker PostgreSQL。
- 注册、登录、刷新令牌轮换、退出、当前用户和管理员权限测试通过。
- 后端 lint、单元测试、真实数据库端到端测试和构建通过。
- 曲库 Seed 已生成并导入 20 首已发布歌曲、10 张专辑和 12 个官方歌单。
- 公开曲库、搜索、歌手、新碟、排行榜、歌单和播放器已通过 Edge 桌面与 390×844 移动端验收。
- 音频 Range 请求返回 `206 Partial Content`，错误重试和空曲库状态已验证。
- 独立管理后台 lint 和生产构建通过。
- 用户业务 migration 已应用，收藏、用户歌单、历史、资料、头像和改密 E2E 通过。
- Edge 浏览器已验证真实注册、歌曲收藏、创建用户歌单、播放历史及刷新后数据保持。
- npm 官方生产依赖安全审计为 0 个漏洞。
- Docker API 与 PostgreSQL 容器健康检查通过。
- `GET /api/health` 返回数据库已连接。

## 开源说明

- 开发分支为 `vue-rewrite`。
- 项目计划在 GitHub 上公开代码并供学习使用。
- 项目采用 MIT 许可证。
- 真实受版权保护的歌曲不得随代码仓库发布。
