# RocketLab

按分组管理常用项目链接（GitLab / Jenkins / Nexus 等）的 Chrome 扩展，支持拖拽排序与导入导出。

## 技术栈

- Vue 3、TypeScript、Vite
- Chrome Extension Manifest V3

## 权限说明

| 权限 | 用途 |
|------|------|
| `storage` | 使用 `chrome.storage.local` 在**本机浏览器**保存分组与链接数据，不上传至任何服务器。 |

扩展不会读取浏览历史、不注入网页脚本采集内容；用户添加的链接与描述仅存储在用户本地的扩展存储中。

## 从源码构建并加载（开发者）

**环境**：建议 Node.js **20 LTS** 或 **22**（与 CI 一致）。

```bash
npm ci
npm run build
```

构建产物在 `dist/` 目录。

在 Chrome / Edge（Chromium）中：

1. 打开 `chrome://extensions`（或 Edge 的 `edge://extensions`）
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」，选择本仓库下的 **`dist`** 文件夹

日常开发可使用：

```bash
npm run dev
```

在 Vite 开发模式下需按扩展开发习惯配合加载（例如使用临时 dist 或扩展开发工具）；发布/自用时以 `npm run build` 结果为准。

### 其他脚本

- `npm run typecheck` — TypeScript 检查  
- `npm run preview` — 本地预览构建后的静态资源（端口 4173）

## 许可证

MIT，见 [LICENSE](./LICENSE)。

本仓库**不发布 npm 包**（`package.json` 中 `private: true`），安装方式以源码构建为准。

## 参与贡献

见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 安全

漏洞报告方式见 [SECURITY.md](./SECURITY.md)。

## GitHub 仓库建议

创建或编辑 GitHub 仓库时，可在 **About** 中添加 **Topics**，便于他人发现，例如：`chrome-extension`、`manifest-v3`、`vue`、`vite`、`typescript`。
