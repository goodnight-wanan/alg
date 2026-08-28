# 悦音音乐管理后台

这是悦音音乐项目的独立管理后台分支，分支名为 `admin-dashboard`，工作目录为 `E:\Web\admin-dashboard`。

用户音乐网站与共享 NestJS API 在同一 GitHub 仓库的 `vue-rewrite` 分支中维护；本分支只负责管理员界面，不在用户前台目录中创建 `admin/` 子项目。

## 已实现

- 管理员账号登录与角色校验。
- Access Token 自动携带与 Refresh Token 自动轮换。
- 歌手、专辑和分类创建。
- 本地音频与封面上传。
- 可信远程音频录入。
- 歌曲搜索、状态筛选、编辑、试听、上下架、删除和批量处理。
- 响应式粉色毛玻璃界面。

## 启动

先在 `vue-rewrite` 分支对应目录启动 API：

```bash
npm run docker:up
```

然后在本目录启动管理后台：

```bash
npm install
npm run dev
```

默认地址为 `http://localhost:5174`，默认 API 地址为 `http://localhost:3000/api`。

如需覆盖 API 地址，复制 `.env.example` 为 `.env` 并修改：

```text
VITE_API_BASE_URL=http://localhost:3000/api
```

## 管理员账号

先通过 `POST /api/auth/register` 注册普通账号，然后在 `vue-rewrite` 分支的 `server/` 目录执行：

```bash
npm run admin:promote -- your-account@example.com
```

该命令需要 `server/.env` 中存在可用的 `DATABASE_URL`。提升角色后即可登录本后台。

## 生产构建

```bash
npm run lint
npm run build
```

部署时必须将 `VITE_API_BASE_URL` 指向实际 API，并在 API 的 `CORS_ORIGIN` 中加入后台域名。
