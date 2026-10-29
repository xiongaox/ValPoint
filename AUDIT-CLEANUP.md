# 复杂度清理清单（Ponytail 审计）

> 基线：`npx tsc --noEmit` 通过；`npm run build` 通过；dev 端口 3208 三入口 200。
> 每项处理完立即核对（tsc / grep / build），项目全程可构建、可运行。

## 进度（已完成）

- [x] 1. 删除 `src/hooks/useIsMobile.ts`（19 行，0 引用，`useDeviceMode` 已覆盖）→ tsc ✅
- [x] 2. 删除 `subscription.ts` 中未用导出 `add/remove/update/reorderSubscription`（约 34 行）→ grep 0 引用 + tsc ✅
- [x] 3. 删除 `src/services/userProfile.ts`（37 行，0 引用）→ tsc ✅
- [x] 4. 删除 `src/` 下 23 个目录级 `README.md` 占位文件（348 行，仅复述目录）→ 保留 `src/README.md` ✅
- [x] 5. 删除 `cors_server.py`（26 行，0 引用）→ grep 0 引用 ✅
- [x] 6. 从 `package.json` 移除冗余依赖 `medium-zoom`、`search-insights`、`react-is` → `npm install` + `npm ls` + build ✅
  - `medium-zoom` 无消费者，已移除
  - `search-insights` / `react-is` 由 vitepress、recharts 传递安装，去掉直声明；`react-is` 版本冲突（ELSPROBLEMS）消除
- [x] 7. 删除 `src/apps/shared/components/SubscriptionModal.tsx`（343 行，0 import）→ 连带删除仅它使用的 `fetchManifest`（约 40 行）→ tsc ✅
- [x] 8. 删除 `src/apps/admin/components/AdminAccessDenied.tsx`（63 行，0 import）→ tsc ✅
- [x] 9. `buildMainViewProps/buildModalProps/buildUiProps`（452 行，单调用方 `useAppController.ts:546/624/711`）→ **保留**
  - 理由：它是刻意保留的 prop 映射层，内联会让 controller 从 734 行膨胀到 ~1186 行，风险/收益不划算；仅建议后续修改时顺手在注释里去掉“生命周期”这类不实描述。
- [x] 10. 地图名互转去重 → 在 `src/constants/maps.ts` 增加 `translateMapName` / `mapNameToEnglish`，替换 `useMapInfo.ts`、`MobileMapPicker.tsx`、`BatchDownloadModal.tsx` 的重复实现 → tsc ✅

## 最终核对

| 检查 | 结果 |
|------|------|
| `npx tsc -p tsconfig.json --noEmit` | exit 0 ✅ |
| `npm run build` | exit 0 ✅（9.66s，2919 modules） |
| `curl localhost:3208/ /user.html /admin.html` | 均 200 ✅ |

## 结果

- 代码净减少约 **-910 行**（项 1–3、4、5、7、8），另有项 10 的少量去重。
- 依赖净减少 **-3**（`medium-zoom`、`search-insights`、`react-is`）。
- 项 9 经评估保留，未改动代码。

> 说明：`npm run build` 仍提示 `Lightbox` chunk >500kB，属性能/拆包问题，不在本次复杂度清理范围。
