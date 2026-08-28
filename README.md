# 悦音音乐

一个面向个人学习、开源展示和朋友间分享的全栈音乐网站项目。

项目由现有 Vue 用户前台、NestJS API、PostgreSQL 数据库组成，并计划增加独立的 Vue 后台管理网站。目标不是大型商业平台，而是完成一套可以自行维护曲库、上传音频、管理数据并部署上线的小型音乐系统。

## 项目架构

```text
用户音乐前台（Vue） ─┐
                     ├─> NestJS API ─> PostgreSQL
管理后台（计划 Vue） ─┘             └> 持久化音频 / 图片目录
```

- 用户前台：音乐浏览、搜索、播放、收藏、歌单和个人中心。
- 管理后台：管理员登录、歌曲上传、曲库维护、用户与站点数据管理。
- API：统一负责鉴权、业务逻辑、文件上传和音频流式播放。
- PostgreSQL：保存用户、歌曲、歌单、收藏和播放历史等结构化数据。
- 音频目录：保存实际音频文件，不把大文件写进数据库或 GitHub。

## 当前状态

### 已完成

- 首页、歌单分类、歌单详情、排行榜、新碟、歌手和搜索页面。
- 登录、注册、我的音乐、个人中心和 404 页面。
- 全局播放器、播放队列、播放模式、音量、进度拖动和 Media Session。
- 收藏歌曲、收藏歌单、自建歌单、播放历史和搜索历史的前端 Mock 流程。
- WebP 头像上传、密码修改前端验证码和退出登录。
- 响应式桌面端、平板和移动端布局。
- NestJS + Prisma + PostgreSQL 后端基础环境。
- Docker Compose、数据库健康检查和 Navicat 连接验证。
- 后端单元测试、端到端测试、构建和生产依赖安全审计。

### 尚未完成

- 真实注册、登录、JWT、管理员角色和用户数据表。
- 歌曲、歌手、专辑、歌单和排行榜数据库迁移。
- 网页版管理后台。
- 音频上传、FFmpeg 压缩和 HTTP Range 播放。
- 收藏、用户歌单和播放历史后端持久化。

当前前端仍使用 `localStorage` 和 `src/data/musicData.js` 模拟主要业务数据。

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
- Navicat Premium Lite 17.3（本地数据库查看）

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

## Navicat 连接

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

# Docker
npm run docker:up
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
├── admin/                    计划中的 Vue 管理后台
├── public/                   前端公开静态资源和演示音频
├── server/                   NestJS + Prisma API
│   ├── prisma/               Prisma 数据库结构
│   ├── src/                  后端源码
│   ├── uploads/              本机上传目录，不进入 Git
│   └── Dockerfile
├── src/                      当前 Vue 用户前台
│   ├── components/           通用组件
│   ├── data/                 待迁移的 Mock 音乐数据
│   ├── router/               路由配置
│   ├── stores/               Pinia 状态
│   ├── styles/               全局与页面样式
│   ├── utils/                通用工具
│   └── views/                页面组件
├── compose.yaml              API、PostgreSQL 和持久化卷编排
├── index.html                Vite 页面入口
├── 补全音乐网站功能项目计划.md  精简开发上下文与阶段计划
└── vite.config.js
```

`admin/` 和 `server/uploads/` 是规划目录，当前仓库可能尚未创建实际内容。

## 后续路线

1. 用户表、管理员角色、注册、登录、JWT 和刷新令牌。
2. 歌手、专辑、歌曲、分类和文件数据模型。
3. Vue 管理后台、歌曲上传、FFmpeg 压缩和上下架管理。
4. 准备至少 20 首合法压缩音频并迁移前台曲库。
5. 收藏、用户歌单、播放历史和个人资料后端持久化。
6. 个人服务器部署、HTTPS、备份和开源整理。

完整阶段说明与验收标准见 `补全音乐网站功能项目计划.md`。

## 验证状态

截至 2026 年 8 月 28 日：

- 前端 `npm run lint` 通过。
- 前端 `npm run build` 通过。
- 后端 Prisma schema 校验通过。
- 后端 lint、单元测试、端到端测试和构建通过。
- npm 官方生产依赖安全审计为 0 个漏洞。
- Docker API 与 PostgreSQL 容器健康检查通过。
- `GET /api/health` 返回数据库已连接。

## 开源说明

- 开发分支为 `vue-rewrite`。
- 项目计划在 GitHub 上公开代码并供学习使用。
- 开源许可证尚未最终确定。
- 真实受版权保护的歌曲不得随代码仓库发布。
