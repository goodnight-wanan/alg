# 悦音音乐

一个基于 Vue 3、Vite、Vue Router 和 Pinia 实现的音乐网站前端项目。它由原静态音乐网站重构而来，使用 `localStorage` 模拟登录、注册、收藏、播放历史等数据持久化能力。

## 功能

- 首页：轮播图、推荐歌单、新歌首发、排行榜
- 歌单分类：按类型、心情、年代、地区筛选（chip 胶囊筛选，筛选条件同步 URL）
- 歌单详情：歌单信息、歌曲列表、播放全部、单曲播放、收藏歌单
- 新碟：新碟首发 banner + 新碟卡片网格（新歌上架、悬浮播放）
- 歌手：歌手聚合列表（多歌手拆分）、地区筛选、页内歌手详情、播放全部
- 排行榜：榜单卡片切换（飙升榜 / 热歌榜 / 新歌榜）、完整排名列表、播放全部
- 全局播放器：播放/暂停、上一首/下一首、进度条、音量、播放队列、顺序/列表循环/单曲循环/随机播放、收藏
- 搜索：热门搜索 / 历史搜索、歌曲 / 歌单 / 歌手三分类、关键词高亮、相关性排序、整行播放
- 用户系统：注册、站内登录、退出、收藏歌曲、收藏歌单、最近播放（含时间戳）
- 我的音乐：个人中心（头像 / 统计 / 退出登录）、收藏歌曲、收藏歌单、最近播放
- 响应式布局：适配桌面端、平板和移动端（导航移动端汉堡菜单）

## 技术栈

- Vue 3
- Vite
- Vue Router 4
- Pinia
- HTML5
- CSS3
- SVG 图标（自绘 `Icon.vue` 组件，跨浏览器一致）

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建产物在 `dist/` 目录中。

## 目录结构

```text
src/
├── components/      通用组件
│   ├── AppHeader.vue   顶部导航（固定、响应式、移动端菜单）
│   ├── Icon.vue        全局 SVG 图标
│   ├── PlayerBar.vue   底部播放器
│   └── UserCard.vue    用户卡片（头像 / 统计 / 退出）
├── data/            歌曲、歌单、分类数据
├── router/          路由配置
├── stores/          Pinia 状态管理（player / user）
├── styles/          全局样式（app.css）
├── utils/           工具（notice / pageCss / storage）
├── views/           页面组件
├── App.vue
└── main.js
```

## 说明

- 开发分支为 `vue-rewrite`，改动完成后提交并推送到该分支备份。
- 全站图标统一使用 `Icon.vue` 的 SVG，未再使用 emoji / Unicode 字符字形。
- 首页、登录、注册的旧静态 CSS（`public/assets/css/`）仍通过 `pageCss.js` 动态加载，已在 `index.html` 通过 `preload` / `prefetch` 预取来缓解切换时的无样式闪现（FOUC）。
