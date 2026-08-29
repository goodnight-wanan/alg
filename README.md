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

本地开发环境预设了一个管理员账号，可直接登录本后台：

| 用户名 | 密码 | 邮箱 | 角色 |
|--------|------|------|------|
| `admin` | `123456` | `admin@example.com` | ADMIN |

> 该账号仅用于本地开发测试，密码为弱密码，切勿用于生产环境。
> 账号是手动写入本地数据库的，新 clone 的环境不会自动创建。

如需自行创建管理员（例如新 clone 仓库、没有预设账号时），按下面步骤操作。

**第 1 步：启动服务**

先在 `vue-rewrite` 分支对应目录启动 API 和数据库：

```bash
npm run docker:up
```

**第 2 步：注册一个普通账号**

打开用户音乐前台 `http://localhost:5173`，点击注册，填写用户名、邮箱和密码完成注册。

> 管理后台只有登录入口、没有注册入口，所以必须先在用户前台注册。

**第 3 步：把账号提升为管理员**

打开终端，进入 `vue-rewrite` 分支的 `server/` 目录，执行下面的命令（把 `你的用户名` 换成第 2 步注册的用户名；用注册邮箱也可以）：

```bash
npm run admin:promote -- 你的用户名
```

例如注册的用户名是 `zhangsan`，就执行：

```bash
npm run admin:promote -- zhangsan
```

**第 4 步：确认成功**

看到下面这样的提示，就说明提升成功了：

```text
Promoted zhangsan (zhangsan@example.com) to ADMIN.
```

如果看到 `User not found: xxx`，说明第 3 步填写的用户名/邮箱和第 2 步注册的不一致，检查后重试。

**第 5 步：登录本后台**

回到管理后台 `http://localhost:5174`，用第 2 步注册的账号和密码登录即可。

## 生产构建

```bash
npm run lint
npm run build
```

部署时必须将 `VITE_API_BASE_URL` 指向实际 API，并在 API 的 `CORS_ORIGIN` 中加入后台域名。
