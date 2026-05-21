# 集享公社 · 用户端（qianduan）

UniApp + Vue3 H5，对接 `http://47.96.102.163/api/v1`。

## 地址对照（本地与线上一致）

| 环境 | 地址 |
|------|------|
| **线上** | http://47.96.102.163/mall/#/ |
| **本地开发** | http://localhost:5173/mall/#/ （`npm run dev:h5`） |
| **本地预览（=线上构建包）** | http://localhost:5173/mall/#/ （`npm run preview:mall`） |

请勿使用 `http://localhost:5173/#/`（无 `/mall/` 前缀会与线上静态资源路径不一致）。

## 命令

```bash
npm install

# 开发（热更新，路径 /mall/）
npm run dev:h5

# 生产构建（与 CI 部署相同）
npm run build:h5
npm run verify:h5

# 本地预览线上同款静态包（推荐发版前自测）
npm run preview:mall
```

PowerShell 一键预览：`.\scripts\start-preview.ps1`

## 环境变量

| 文件 | 用途 |
|------|------|
| `.env.development` | 本地 `dev:h5`，`VITE_BASE_URL=/mall/` |
| `.env` | 生产构建 `build:h5`，与线上一致 |

API 地址默认：`http://47.96.102.163/api/v1`（见 `src/config/index.ts`）。

## 部署到线上

推送到 `main` 后 GitHub Actions 会：

1. `npm run build:h5` + `verify:h5`（校验 index 引用的 css/js 均存在）
2. `rsync --delete` 整包同步到服务器 `/www/jixiang-qianduan/h5/`

手动部署时需**整目录覆盖**，不要只传单个 js 文件，否则会出现 JS 新、CSS 旧导致页面样式与本地不一致。

部署后请在浏览器 **强制刷新**（Ctrl+F5）或清缓存；`index.html` 已配置不缓存，`assets/*` 带 hash 可长期缓存。

## Tab 结构

主页 · 分类 · 购物车 · 增值区 · 我的
