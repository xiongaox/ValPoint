# 全量扫描清单（Ponytail / ValPoint）

> 扫描范围：仓库全部手写文件（已排除 `node_modules`、`server/node_modules`、`dist`、`docs/.vitepress/{cache,dist}`、`public/` 静态资源与图片）。
> 基线：`tsc` 通过、`npm run build` 通过、3208 三入口 200。
> 规则：每完成一项即跑 `tsc`（涉及依赖/产物再跑 `build`），不通过就回退该项。

## A. 可直接删除（safe-delete）

| # | 项 | 位置 | 行数 | 证据 | 状态 |
|---|----|------|------|------|------|
| A1 | 未用导出 `getAbilityIconSafe` | `src/features/lineups/lineupHelpers.ts:147` | 2 | 全仓仅 1 次（定义） | ☑ |
| A2 | 未用导出 `clearAvatarCache` | `src/components/UserAvatar.tsx:211` | 9 | 全仓仅 1 次 | ☑ |
| A3 | 未用导出 `adminUploadMultiple` | `src/lib/adminUpload.ts:203-231` | 29 | 全仓仅 1 次 | ☑ |
| A4 | 未用导出 `getAllowedDomains` | `src/lib/emailValidator.ts:72-74` | 3 | 全仓仅 1 次 | ☑ |
| A5 | 未用导出 `compressClipboardImage` | `src/lib/imageCompression.ts:125-129` | 5 | 全仓仅 1 次 | ☑ |
| A6 | 未用导出 `buildDateSegments`/`buildTimestampName` | `src/lib/imageBed/utils.ts:22-38` | 16 | 各仅 1 次 | ☑ |
| A7 | 未用小助手 `invalidateSettingsCache`/`clearMapPoolCache`/`getRandomAvatar`/`getAvatarByUserId` | `systemSettings.ts:99`、`mapPoolService.ts:75`、`avatarUtils.ts:25,29` | 14 | 各仅 1 次 | ☑ |
| A8 | `POOL_STATUS_CONFIG` 重复定义 | `MapPickerModal.tsx:17` 与 `MobileMapPicker.tsx:17` | ~9 | 两处内容完全一致 | ☑ |
| A9 | 提交了 Obsidian 插件包 | `docs/.obsidian/`（14 文件 920K） | 未计 | 编辑器配置，与构建无关，应 gitignore | ☑ |
| A10 | 单次使用的 `DeleteConfirmModal` 薄包装 | `src/components/DeleteConfirmModal.tsx` | 32 | 仅 `AppModals.tsx:263` 用一次，内部只是 `AlertModal` 固定 props | ☑ |

## B. 需确认后再动（verify-first）

| # | 项 | 位置 | 证据 | 结论 |
|---|----|------|------|------|
| B1 | `MapPickerModal`(101) 与 `MobileMapPicker`(131) 同一「选地图」UI 两套实现 | `src/components/` | 相同 props、都渲染 `maps.map` + `POOL_STATUS_CONFIG` | 合并需产品确认交互差异 |
| B2 | `src/lib` 与 `src/services` 两个 API 封装目录并存，边界被打破 | `src/lib/{adminService,reviewService,syncService,submissionUpload}.ts` 直接 import `supabaseClient` | AGENTS 规定 API 调用放 services | 大重构，暂不动 |
| B3 | `ViewerModal`(356) 与 `Lightbox`(741) 都做图片查看 | `src/components/` | 两组件都被 `AppModals` 同时挂载 | 需确认场景差异 |
| B4 | 一次性数据脚本 | `scripts/{fetchAbilities,refresh_author_info,upload_playercards_to_oss}`（`update_abilities` 已删除） | 运维脚本，`scripts/README.md` 有说明 | 保留 |
| B5 | 多部署平台配置并存 | `vercel.json`、`wrangler.toml`、`api/`、`functions/`、`Dockerfile`、`nginx.conf`、3 个 workflow | 每平台各一份入口 | 保留（多平台发布） |

## C. 仅记录（超范围，不改）

- 12 个文件带 `@ts-nocheck/@ts-ignore`（`ViewerModal`、`EditorModal`、`LeafletMap`、`RightPanel`、`reviewService` 等）——类型安全，非复杂度。
- 大文件：`localAgents.ts`(887 数据)、`SharedMainView.tsx`(788)、`Lightbox.tsx`(741)、`useAppController.ts`(734)、`MainView.tsx`(704)。拆分属重构，不做。
- `Lightbox` chunk >500kB，性能/拆包问题。
- 上一轮已保留的 prop 拼接层（`buildMainViewProps` 等 452 行）仍保留。

## 执行记录

- A1–A7：删除 11 个无引用导出/助手（约 78 行）。核对：`grep` 全仓 0 引用 + `tsc` ✅
- A8：`POOL_STATUS_CONFIG` 抽到 `src/constants/maps.ts`，`MapPickerModal`/`MobileMapPicker` 改为引用。核对：`tsc` ✅
- A9：`.gitignore` 改为忽略整个 `docs/.obsidian/`，并 `git rm -r --cached docs/.obsidian`（本地文件保留，仅取消追踪 14 个文件/920K）。核对：`git ls-files docs/.obsidian` = 0 ✅
- A10：删除 `DeleteConfirmModal` 薄包装，`AppModals` 直接用 `AlertModal`（含 `deleteTargetId` 判空）。核对：0 引用 + `tsc` ✅
- 最终：`npm run build` exit 0（5.88s）+ 3208 三入口 200 ✅

## 本轮净变化

- 代码净减约 **-100 行**（A1–A8、A10），另取消追踪 14 个 Obsidian 文件。
- 依赖：无变化。
- B 类（合并组件 / 目录收敛）经评估风险偏高，保留，待产品确认后再做。
