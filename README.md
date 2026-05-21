# 集享公社 · 用户端前端（001 独立版）

UniApp + Vue3 + Pinia，对接 `API_SPEC.md` 契约。

## 本地开发

```bash
cd D:\xiangmu\001
npm install
npm run dev:h5
```

浏览器打开：**http://localhost:5173/** 或 **http://127.0.0.1:5173/**

若 `dev:h5` 首次编译较慢或白屏，请用预览模式（必须从 `dist/build/h5` 目录启动）：

```bash
npm run preview:h5
```

或 PowerShell：

```powershell
.\scripts\start-preview.ps1
```

**白屏常见原因**：5173 端口被错误目录的静态服务占用，导致 JS 只返回 404 页面（约 500 字节）。务必在 `dist/build/h5` 下启动。

## 环境变量

复制 `.env.example` 为 `.env.development` 可修改 API 地址：

```
VITE_API_BASE_URL=http://47.96.102.163/api/v1
```

## Tab 结构

首页 · 分类 · 购物车 · 订单 · 我的

首页磁贴：消费商城 / 换购商城 / 兑换商城 / 增值专区
