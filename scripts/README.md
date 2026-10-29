# scripts

用途：存放构建、发版、数据维护等脚本与自动化工具。

## 构建 / 发版
- auto_tag.js：`npm run release` 发版（递增版本、打 tag、推 tag 触发 CI）。
- build-all.js：`npm run build:all` 统一构建主应用 + VitePress，合并到 `dist/wiki/`。
- generate-env-config.js：从 `.env` 的 `VITE_*` 生成 `dist/env-config.js`。

## 数据维护（本地手动运行）
- fetchAbilities.cjs：抓取国服技能数据，生成 `src/data/ability_overrides.json`。
- refresh_author_info.cjs：批量修复 Supabase 作者信息（`--table/--limit/--delay/--dry-run`）。
- upload_playercards_to_oss.js：下载卡面图上传 OSS，生成 `public/data/playercards_cn.json` 可选缓存。

## 运维 / 校验
- cleanup-releases.mjs：清理 GitHub Release 及 tag（保留最近 N 个，需 `--token`）。
- build-multi-arch.sh：本地 buildx 构建并推送 amd64+arm64 镜像。
- check-position-clusters.ts：站位/落点聚类最小断言（`node scripts/check-position-clusters.ts`）。
