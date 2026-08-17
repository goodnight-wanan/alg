# 悦音音乐

一个基于 Vue 3、Vite、Vue Router 和 Pinia 实现的音乐网站前端项目。它是由原静态音乐网站重构而来，使用 `localStorage` 模拟登录、注册、收藏、播放历史等数据持久化能力。

## 功能

- 首页：轮播图、推荐歌单、新歌首发、排行榜
- 歌单分类：按类型、心情、年代、地区筛选
- 歌单详情：歌单信息、播放全部、单曲播放、收藏歌单
- 全局播放器：播放/暂停、上一首/下一首、进度条、音量、播放队列、顺序/单曲/随机播放
- 搜索：歌曲、歌手、专辑、歌单
- 用户系统：注册、登录、退出、收藏歌曲、收藏歌单、最近播放
- 响应式布局：适配桌面端、平板和移动端

## 技术栈

- Vue 3
- Vite
- Vue Router 4
- Pinia
- HTML5
- CSS3

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
├── data/            歌曲、歌单、分类数据
├── router/          路由配置
├── stores/          Pinia 状态管理
├── utils/           本地存储工具
├── views/           页面组件
├── App.vue
├── main.js
└── style.css
```
