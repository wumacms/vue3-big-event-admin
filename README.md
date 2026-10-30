# vue3-big-event-admin

大事件后台管理系统，基于 Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus + wangEditor。

## 效果图

![效果图](./docs/images/1.avif)

## 功能

- 登录 / 注册（表单校验、token 持久化、路由守卫）
- 后台布局（可折叠侧边菜单、面包屑、用户信息下拉、退出登录）
- 首页：问候语、模块快捷入口、当前登录信息、演示数据重置
- 文章分类：增删改查，有关联文章时禁止删除
- 文章管理：分类/状态筛选、分页、封面缩略图、发布/编辑（富文本、封面上传、草稿）、详情预览（内容已做 XSS 清洗）
- 个人中心：修改基本资料、更换头像
- 404 页面、写操作全局 loading、重复请求自动取消
- 界面文案中文化（Element Plus 内置文案经 `el-config-provider` 切换为 zh-cn）

## 本地演示（Mock 模式）

Mock 由 [MSW](https://mswjs.io)（Mock Service Worker）实现，无需后端即可完整体验：

```
演示账号：admin / admin123
```

- 接口请求是**真实的网络请求**，浏览器 DevTools 的 Network 面板能看到完整的 URL、方法、请求体与响应体，响应标注 `from service worker`
- 打开 `src/mock/handlers.ts` 就能看到所有接口的定义，写法与真实后端路由一一对应
- 数据保存在浏览器 localStorage，所有增删改即时生效；首页提供「重置演示数据」入口
- 同一套 handlers 也被单元测试复用（`setupServer`），Mock 行为与页面完全一致

**演示数据**：21 篇文章分布在 6 个分类（其中 4 篇草稿，发布时间跨度 45 天，正文按真实技术博客的结构组织——小标题、代码块、引用）。封面走 Lorem Picsum 免费图片 API，头像走 Unsplash CDN 直链，见 `src/mock/image.ts`。种子数据改完后把 `src/mock/db.ts` 里的 `SEED_VERSION` 递增一位，浏览器里的旧缓存会自动失效。

**切换真实后端**：把 `.env` 里的 `VITE_USE_MOCK` 改成 `false` 即可，业务代码零改动；关闭后 MSW 不会被打进产物。

## 目录结构

```
src/
├── api/        # 接口模块（user / article）
├── assets/     # 全局样式
├── components/ # 通用组件（RichEditor 富文本编辑器）
├── layout/     # 后台布局
├── mock/       # MSW Mock：handlers 接口定义 / browser 启动 / db 数据组装
│               # articles 演示文章种子 / image 演示图片地址
├── router/     # 路由与登录守卫
├── stores/     # Pinia 状态（user）
├── test/       # 单测环境（启动 MSW node server）
├── types/      # 接口数据类型、axios 类型扩展
├── utils/      # axios 封装、富文本清洗
└── views/      # 页面
```

## 开发

> 依赖需用 pnpm 12 安装：它的 store 目录是 `store/v11`，而 pnpm 10 用的是 `store/v10`，版本对不上时 `install` / `add` 会直接报 `ERR_PNPM_UNEXPECTED_STORE`。本机若还是 pnpm 10，把命令换成 `corepack pnpm@12.16.1 <命令>` 即可。

```sh
pnpm install
pnpm dev          # 启动开发服务
pnpm type-check   # 类型检查
pnpm lint         # 代码检查（oxlint + eslint，自动修复）
pnpm test         # 单元测试（vitest，仅运行一次）
pnpm test:watch   # 单元测试（监听模式）
pnpm build        # 类型检查 + 生产构建
pnpm preview      # 预览构建产物
pnpm analyze      # 构建并生成体积报告 dist/stats.html
```

提交代码遵循 Conventional Commits（`feat: xxx` / `fix: xxx`，描述可用中文），husky 会在
pre-commit 执行 lint-staged、commit-msg 校验提交信息。

## 接口配置

接口地址通过 `.env` 配置：

```
VITE_API_BASE_URL=https://big-event-api-t.itheima.net
VITE_USE_MOCK=true
```

- `VITE_USE_MOCK=true`：接口走同源路径，由 Service Worker 拦截（MSW 只能拦截同源请求）
- `VITE_USE_MOCK=false`：请求直接发往 `VITE_API_BASE_URL`

接口统一返回 `{ code, message, data }`，`code === 0` 表示成功。

## 新增一个 Mock 接口

在 `src/mock/handlers.ts` 里加一个 handler 即可，路径与方法跟真实接口保持一致：

```ts
http.get(api('/article/count'), ({ request }) =>
  withAuth(request, () => ok({ total: mockDb.articles.length })),
)
```

两个要点：

- 路径必须用 `api('/xxx')` 拼前缀，**不要直接写 `'/api/xxx'`**。`api()` 会带上部署用的 base 前缀（GitHub Pages 下是 `/<repo>/api/xxx`），否则请求落在 Service Worker 作用域外，拦截不到会直接 404
- 需要登录的接口用 `withAuth(request, handler)` 包一层，会自动校验 token 并在未登录时返回 401

再在 `src/api/` 下补一个接口函数，页面与单元测试就同时生效了。

## 部署

`.github/workflows/deploy.yml` 在 push 到 `main`（或手动触发）时自动：检查 Pages 是否启用 → 安装依赖 → 单测 → 构建 → 发布 GitHub Pages。

- 子路径 base 由 CI 注入 `VITE_BASE=/<repo>/`
- CI 里固定 `VITE_USE_MOCK: true`——Pages 是纯静态托管，没有后端可连，线上站同样靠 Service Worker 出数据
- SPA 刷新 404 通过 `dist/404.html` 兜底
- 自定义域名：在仓库 Variables 里设置 `CUSTOM_DOMAIN`，CI 会改写 base 为 `/` 并生成 `dist/CNAME`
- 首次使用需在仓库 Settings → Pages 将 Source 设为 GitHub Actions，否则构建第一步会明确报错退出；若想用 PAT 自动开启 Pages，配置 Secrets `GH_PAGES_TOKEN`
