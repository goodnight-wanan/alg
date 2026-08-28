# 悦音音乐

一个基于 Vue 3、Vite、Vue Router 和 Pinia 实现的音乐网站前端项目。它由原静态音乐网站重构而来，当前使用 `localStorage` 模拟登录、注册、收藏、播放历史等数据持久化能力，下一步将接入真实后端。

## 功能

- 首页：轮播图、推荐歌单、新歌首发、排行榜
- 歌单分类：按类型、心情、年代、地区筛选（chip 胶囊筛选，筛选条件同步 URL）
- 歌单详情：歌单信息、歌曲列表、播放全部、单曲播放、收藏歌单
- 新碟：新碟首发 banner + 新碟卡片网格（新歌上架、悬浮播放）
- 歌手：歌手聚合列表（多歌手拆分）、地区筛选、页内歌手详情、播放全部
- 排行榜：榜单卡片切换（飙升榜 / 热歌榜 / 新歌榜）、完整排名列表、播放全部
- 全局播放器：播放/暂停、上一首/下一首、进度条、音量、播放队列、顺序/列表循环/单曲循环/随机播放、收藏和添加到自建歌单
- 搜索：顶部联想面板、热门搜索 / 历史搜索、歌曲 / 歌单 / 歌手三分类、关键词高亮、相关性排序、整行播放、`/` 快捷键聚焦
- 用户系统：注册、独立窗口登录、收藏歌曲、收藏歌单、最近播放（含时间戳），用户数据按账号隔离
- 我的音乐：图片头像与统计、收藏歌曲、收藏歌单、最近播放；自建歌单与普通歌单共用卡片和详情页，支持创建 / 播放 / 删除 / 移除歌曲
- 响应式布局：适配桌面端、平板和移动端，900px 以下使用汉堡导航

## 技术栈

- Vue 3
- Vite
- Vue Router 4
- Pinia
- HTML5 / CSS3
- SVG 图标（自绘 `Icon.vue` 组件，跨浏览器一致）
- ESLint + Prettier（代码规范）
- sharp（图片转 WebP 脚本）

## 本地运行

```bash
npm install
npm run dev
```

## 构建与代码检查

```bash
npm run build   # 构建到 dist/
npm run lint    # ESLint 检查
npm run format  # Prettier 格式化（仅 src、index.html、eslint.config.js）
```

## 目录结构

```text
├── public/           静态资源（图片已统一 WebP、音频、favicon）
├── src/
│   ├── components/   通用组件（AppHeader / PlayerBar / UserCard / Icon / AddToPlaylistButton）
│   ├── data/         歌曲、歌单、分类 mock 数据
│   ├── router/       路由配置
│   ├── stores/       Pinia 状态管理（player / user）
│   ├── styles/       全局样式（app.css，含设计 token）
│   ├── utils/        工具（notice / authWindow / searchHistory / storage）
│   ├── views/        页面组件
│   ├── App.vue
│   └── main.js
├── convert-images.mjs  图片转 WebP 脚本
├── eslint.config.js
├── .prettierrc
├── .prettierignore
└── vite.config.js
```

## 说明

- 开发分支为 `vue-rewrite`，改动完成后提交并推送到该分支备份。
- 全站图标统一使用 `Icon.vue` 的 SVG。
- 图片已统一转为 WebP；后续新增图片可用 `node convert-images.mjs` 转换。
- 首页、登录、注册样式已迁入 `src/styles/` 并由 Vite 静态打包，运行时 CSS 注入工具已移除。
- 当前 106 首歌曲仍共用演示音频；接入后端时需要替换为真实授权音频和封面 URL。

## 后端接入计划

当前前端数据、鉴权、收藏、历史均为 mock，后续按以下方式接入后端：

**技术栈（建议）**：Node.js + Express（或 NestJS）、MySQL / PostgreSQL（或 SQLite）、JWT 鉴权、音频与封面走本地目录或 OSS/S3。

**主要接口**：`auth`（register / login / me）、`songs`、`playlists`、`artists`、`rank`、`search`、`favorites`、`history`、`audio/:id`（支持 HTTP Range 流式播放）。

**前端改造**：新增 `src/api/` 请求层与 `stores/catalog.js`，替换 `data/musicData.js` 的直接引用；`user.js` 改为 JWT 登录；`player.js` 播放后端返回的音频 URL；`vite.config.js` 增加 `/api` 开发代理；新增 `.env` 配置 `VITE_API_BASE`。

**建议落地顺序**：先跑通「注册 / 登录（JWT）→ 歌曲列表 → 音频流式播放」，再迁移歌单、搜索、收藏、历史。
