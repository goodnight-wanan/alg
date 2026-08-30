# 悦音音乐管理后台

悦音音乐项目的独立管理后台，分支 `admin-dashboard`。用户前台与共享 NestJS API 在同仓库的 `vue-rewrite` 分支维护，本分支只负责管理员界面。

## 核心功能

- 管理员登录与角色校验，Access Token 自动携带、Refresh Token 自动轮换。
- 歌曲管理：本地上传（FFmpeg 转 MP3）、远程 URL 录入、编辑、试听、上下架、删除与批量操作。
- 歌手、专辑、分类管理：分类按「类型/心情/年代/地区/榜单/特色」分组，歌曲标签用可勾选芯片。
- 数据汇总卡片、操作弹窗提示，响应式粉色毛玻璃界面。

## 目录结构

```
├── src/                         # 管理后台源码
│   ├── admin/                   # 后台业务代码
│   │   ├── api.js               # 后端接口封装（登录、歌曲/歌手/专辑/分类 CRUD）
│   │   ├── auth.js              # 管理员登录状态（Pinia，含 Token 自动轮换）
│   │   ├── stats.js             # 数据汇总统计（卡片数字）
│   │   ├── components/          # 后台组件
│   │   │   └── CategoryTagPicker.vue   # 分类标签多选芯片
│   │   ├── styles.css           # 后台全局样式
│   │   └── views/               # 后台页面
│   │       ├── AdminLoginView.vue      # 管理员登录页
│   │       └── AdminSongsView.vue      # 曲库管理页（列表 + 增删改查）
│   ├── App.vue                  # 根组件（后台布局、顶栏、退出登录）
│   ├── main.js                  # 应用入口（挂载 Pinia + Router）
│   └── router/index.js          # 路由配置 + 管理员鉴权守卫
├── public/                      # 静态资源（favicon.svg）
├── index.html                   # 页面模板
├── vite.config.js               # Vite 构建配置
├── eslint.config.js             # ESLint 代码规范
├── package.json                 # 依赖与 npm 脚本
└── .env.example                 # 环境变量示例（VITE_API_BASE_URL）
```

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

## 数据库连接信息

本地开发时可以用 DBX 等可视化工具连接 PostgreSQL 查看数据。连接参数如下：

| 项目 | 值 |
|------|-----|
| 类型 | PostgreSQL |
| 主机 | localhost |
| 端口 | 5432 |
| 用户名 | music_admin |
| 密码 | music_dev_password |
| 数据库 | music_site |

> 以上为本地开发默认参数，仅用于本机排查；部署到服务器时必须通过环境变量替换为生产密码。

数据库结构以 `server/prisma/schema.prisma` 和 migrations 为准，建表、改表、加索引请提交 Prisma migration，不要用可视化工具直接改表结构。

## 管理员账号

管理后台没有注册入口，管理员按以下步骤产生：

1. 在用户前台 http://localhost:5173 注册一个普通账号。
2. 进入 `vue-rewrite` 的 `server/` 目录，执行提升命令：

```bash
npm run admin:promote -- 你的用户名
```

3. 看到 `Promoted xxx to ADMIN.` 即成功，用该账号登录管理后台。

> 新 clone 的环境不会自动创建管理员账号，需按上述步骤创建。生产环境同样用此方式创建，务必使用强密码。

## 录入可信远程 URL 的步骤

后台支持录入「远程歌曲」：音频文件不存放在自己的服务器，而是直接引用一个外部可访问的音频直链（比如对象存储、CDN，或任意能放音乐文件的网址）。出于安全考虑，只有「可信域名」里的链接才允许录入。

### 第 1 步：把域名加入可信白名单

远程链接的域名必须提前加入白名单，否则录入时会提示「远程音频地址不在可信域名白名单中」。

在 API 的环境变量文件里（参考 `server/.env.example`），找到 `REMOTE_AUDIO_HOSTS`，填入允许的域名，多个用英文逗号分隔：

```bash
REMOTE_AUDIO_HOSTS=example.com,cdn.example.com
```

- 只填域名本身，不要带 `http://` 或后面的路径。
- 填了 `example.com`，它的子域名 `music.example.com` 也会自动放行。
- 改完保存后，重启 API 容器让配置生效（在 `vue-rewrite` 目录执行）：

```bash
docker compose restart api
```

### 第 2 步：登录后台，打开「录入远程歌曲」表单

用管理员账号登录后台，进入歌曲管理页面，在「上传本地歌曲 / 录入远程歌曲」区域切换到「录入远程歌曲」表单。

### 第 3 步：填写歌曲信息

| 字段 | 说明 | 是否必填 |
|------|------|:---:|
| 歌曲名称 | 歌曲标题 | 必填 |
| 歌手 | 从下拉框选择（需先在歌手管理里创建） | 必填 |
| 专辑 | 从下拉框选择，可不选 | 选填 |
| 远程音频地址 | 完整的音频直链，例如 `https://example.com/music/song.mp3` | 必填 |
| 分类 | 点选标签芯片，可不选 | 选填 |
| 状态 | 草稿 / 上架，默认草稿 | 必填 |

### 第 4 步：提交并验证

点击「创建远程歌曲」，成功后歌曲会出现在列表里。播放时浏览器会直接跳转到你填写的那个音频链接拉取声音，所以链接必须满足：

- 是**能直接打开**的完整地址，以 `http://` 或 `https://` 开头；
- 不能带用户名或密码；
- 存放音频的服务器要允许外网直接访问，不能有防盗链限制（否则播放器拉不到声音）。

## 生产构建

```bash
npm run lint
npm run build
```

部署时设置 `VITE_API_BASE_URL` 指向实际 API，并在 API 的 `CORS_ORIGIN` 中加入后台域名。
