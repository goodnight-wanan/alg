# 悦音音乐管理后台

悦音音乐项目的独立管理后台，分支 `admin-dashboard`，本地目录 `E:\Web\admin-dashboard`。用户前台与共享 NestJS API 在同仓库的 `vue-rewrite` 分支维护，本分支只负责管理员界面。

## 核心功能

- 管理员登录与角色校验，Access Token 自动携带、Refresh Token 自动轮换。
- 歌曲管理：本地上传（FFmpeg 转 MP3）、远程 URL 录入、编辑、试听、上下架、删除与批量操作。
- 歌手、专辑、分类管理：分类按「类型/心情/年代/地区/榜单/特色」分组，歌曲标签用可勾选芯片。
- 数据汇总卡片、操作弹窗提示，响应式粉色毛玻璃界面。

## 启动（本地开发）

先启动 API 和数据库（在 `vue-rewrite` 目录执行）：

```bash
npm run docker:up
```

再启动管理后台：

```bash
npm install
npm run dev
```

默认地址 http://localhost:5174，默认 API 地址 http://localhost:3000/api。可通过 `.env` 的 `VITE_API_BASE_URL` 覆盖。

## 管理员账号

管理后台没有注册入口，管理员按以下步骤产生：

1. 在用户前台 http://localhost:5173 注册一个普通账号。
2. 进入 `vue-rewrite` 的 `server/` 目录，执行提升命令：

```bash
npm run admin:promote -- 你的用户名
```

3. 看到 `Promoted xxx to ADMIN.` 即成功，用该账号登录管理后台。

> 新 clone 的环境不会自动创建管理员账号，需按上述步骤创建。生产环境同样用此方式创建，务必使用强密码。

## 生产构建

```bash
npm run lint
npm run build
```

部署时设置 `VITE_API_BASE_URL` 指向实际 API，并在 API 的 `CORS_ORIGIN` 中加入后台域名。
