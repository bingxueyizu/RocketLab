# 参与贡献

感谢你对 RocketLab 的兴趣。

## 开发流程

1. Fork 本仓库并创建分支（`feat/…`、`fix/…` 等）。
2. 本地安装依赖并确保能通过检查与构建：

   ```bash
   npm ci
   npm run typecheck
   npm run build
   ```

3. 提交时请写清楚变更说明；如有用户可见行为变化，可在 PR 中简要说明。
4. 发起 Pull Request 到 `main`（或仓库默认分支）。

## 代码约定

- 与现有 TypeScript / Vue 风格保持一致。
- 不提交 `node_modules/`、`dist/` 或本地密钥、`.env` 等敏感文件。

## 问题反馈

使用 GitHub Issues 描述复现步骤、浏览器版本与扩展版本（`manifest.json` 中的 `version`）。
