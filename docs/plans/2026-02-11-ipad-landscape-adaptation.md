# iPad 横屏适配 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 `user.html`（个人库）和 `index.html`（共享库）实现 iPad 横屏专用布局，同时保证 iPad 竖屏严格走现有移动端逻辑。

**Architecture:** 新增统一的设备视口判定 Hook（mobile / tablet-landscape / desktop），把当前“仅按宽度判断移动端”的逻辑升级为“设备 + 方向 + 宽度”联合判定。主视图采用 iPad 横屏混合布局（紧凑左栏 + 可开合右侧抽屉），避免 1024 宽度下地图区域被三栏挤压。状态层只感知“是否移动端”，确保竖屏回落到移动端行为，横屏保持桌面能力但使用平板布局。

**Tech Stack:** React 18 + TypeScript（strict）+ Tailwind utility class + Leaflet（现有地图容器）

---

### Task 1: 定义适配范围与验收标准（先收口）

**Files:**
- Modify: `docs/plans/2026-02-11-ipad-landscape-adaptation.md`
- Reference: `src/features/lineups/MainView.tsx`
- Reference: `src/apps/shared/SharedMainView.tsx`

**Step 1: 固化范围（本次做）**

- 覆盖页面：个人库主视图、共享库主视图。
- 不覆盖页面：`admin.html` 后台页面（单独立项）。
- 设备策略：
  - iPad 竖屏：移动端逻辑（现有移动 UI）。
  - iPad 横屏：新增平板横屏逻辑（不是纯桌面，也不是纯移动）。
  - 非 iPad：维持现有行为。

**Step 2: 定义验收口径**

- iPad Air/Pro 横屏下地图可视宽度显著提升（不再固定三栏挤压）。
- iPad 竖屏下出现移动端顶部/底部控件，不出现桌面左右面板。
- 横竖屏切换不中断筛选条件（地图、特工、攻防、搜索保留）。
- 关键动作可用：查看点位、编辑/下载、筛选、切图库、打开点位列表。

**Step 2.1: 范围冻结（2026-02-11）**

- 本批次只覆盖 `user.html` 与 `index.html` 主视图链路，不处理 `admin.html`。
- iPad 判定仅用于布局策略，不改业务数据流与 Supabase 请求路径。
- 所有改造需保持非 iPad 桌面和手机行为不变。

**Step 3: 提交**

```bash
git add docs/plans/2026-02-11-ipad-landscape-adaptation.md
git commit -m "docs: define ipad landscape adaptation scope and acceptance criteria"
```

### Task 2: 建立统一设备模式判定 Hook

**Files:**
- Create: `src/hooks/useDeviceMode.ts`
- Modify: `src/hooks/useIsMobile.ts`
- Reference: `src/hooks/README.md`

**Step 1: 新增 `useDeviceMode`（纯判定）**

- 输出结构：
  - `mode: 'mobile' | 'tablet-landscape' | 'desktop'`
  - `isMobile`
  - `isTabletLandscape`
  - `isIPad`
  - `isPortrait`
- 判定规则：
  - iPad 识别：`/iPad/` 或 (`navigator.platform === 'MacIntel' && maxTouchPoints > 1`)。
  - iPad + 竖屏 => `mobile`。
  - iPad + 横屏 => `tablet-landscape`。
  - 其它设备按现有断点（`<768 => mobile`，其余 `desktop`）。

**Step 2: 让 `useIsMobile` 兼容旧调用**

- `useIsMobile` 内部委托 `useDeviceMode`，仅返回 `isMobile`。
- 保持函数签名不变，避免全仓调用点大规模改动。

**Step 3: 类型检查**

Run: `npx tsc -p tsconfig.json --noEmit`  
Expected: PASS

**Step 4: 提交**

```bash
git add src/hooks/useDeviceMode.ts src/hooks/useIsMobile.ts
git commit -m "feat: add unified device mode detection for ipad orientation"
```

### Task 3: 状态层切换为“移动模式感知”，保证竖屏回落一致

**Files:**
- Modify: `src/features/lineups/controllers/useAppState.ts`
- Modify: `src/apps/shared/useSharedController.ts`

**Step 1: 用新 Hook 驱动默认攻防逻辑**

- 把 `useIsMobile` 读值替换为 `useDeviceMode().isMobile`。
- 初始 `selectedSide` 逻辑保留：移动端 `attack`，非移动端 `all`。
- `handleReset` 等依赖移动端分支的逻辑同步替换为 `isMobile`（来自新 Hook）。

**Step 2: 验证行为一致性**

- iPad 竖屏刷新页面：默认应为 `attack`。
- iPad 横屏刷新页面：默认应为 `all`（桌面能力）。

**Step 3: 提交**

```bash
git add src/features/lineups/controllers/useAppState.ts src/apps/shared/useSharedController.ts
git commit -m "refactor: drive lineup defaults by unified mobile mode"
```

### Task 4: 个人库主视图实现 iPad 横屏混合布局

**Files:**
- Modify: `src/features/lineups/MainView.tsx`
- Modify: `src/components/LeftPanel.tsx`
- Modify: `src/components/RightPanel.tsx`

**Step 1: `MainView` 增加三态渲染分支**

- `mobile`：沿用现有移动布局（不改 UI 结构）。
- `desktop`：沿用现有桌面三栏布局。
- `tablet-landscape`：新增混合布局：
  - 左栏保持常驻但改紧凑宽度（例如 `248px`）。
  - 右栏改抽屉式（默认收起，点“点位列表/筛选”按钮展开）。
  - 地图容器始终占主空间，避免 1024 下被左右栏挤压到不可用。

**Step 2: 面板组件支持 `compact` / `tablet` 变体**

- `LeftPanel`：新增可选 `variant` 或 `className` 注入，支持平板紧凑宽度与更小内边距。
- `RightPanel`：支持作为抽屉容器渲染（可通过外层包裹控制定位，也可新增 `layoutMode`）。

**Step 3: 交互补齐**

- 平板横屏下新增右侧抽屉开关按钮（浮层按钮），支持打开/关闭列表。
- 点击地图或选择点位后可自动关闭抽屉（保持地图优先）。

**Step 4: 冒烟**

- 设备模拟：iPad Air (820x1180) 横屏、iPad Pro 11" 横屏。
- 核对：地图可视面积、列表可操作、创建/查看流程不回归。

**Step 5: 提交**

```bash
git add src/features/lineups/MainView.tsx src/components/LeftPanel.tsx src/components/RightPanel.tsx
git commit -m "feat: add ipad landscape hybrid layout for personal library"
```

### Task 5: 共享库主视图同步 iPad 横屏布局策略

**Files:**
- Modify: `src/apps/shared/SharedMainView.tsx`
- Modify: `src/apps/shared/SharedRightPanel.tsx`
- Modify: `src/components/LeftPanel.tsx` (复用 Task 4 的变体能力)

**Step 1: `SharedMainView` 对齐三态策略**

- `mobile`：保留现有移动逻辑。
- `desktop`：保留现有桌面三栏。
- `tablet-landscape`：复用“紧凑左栏 + 右抽屉 + 地图优先”的布局模型。

**Step 2: `SharedRightPanel` 支持平板抽屉**

- 右栏在平板模式下改为可开合容器，保留现有筛选/分页行为。
- 对 `pending` 标签页做高度与滚动检查，确保抽屉内正常工作。

**Step 3: 提交**

```bash
git add src/apps/shared/SharedMainView.tsx src/apps/shared/SharedRightPanel.tsx src/components/LeftPanel.tsx
git commit -m "feat: align shared library with ipad landscape hybrid layout"
```

### Task 6: 详情弹窗与灯箱在平板横屏下做可读性微调

**Files:**
- Modify: `src/components/ViewerModal.tsx`
- Modify: `src/components/Lightbox.tsx`

**Step 1: 将“移动判定”升级为“模式判定”**

- 保持 iPad 竖屏使用移动弹窗行为。
- iPad 横屏使用桌面行为，但缩小字号/间距和最大宽度，避免横屏内容过满。

**Step 2: 触控交互验证**

- 横屏下确认手势缩放、图片切换、关闭按钮可达。
- 竖屏下确认仍是全屏移动弹窗样式。

**Step 3: 提交**

```bash
git add src/components/ViewerModal.tsx src/components/Lightbox.tsx
git commit -m "style: tune viewer and lightbox readability for ipad landscape"
```

### Task 7: 补充全局样式与安全区处理

**Files:**
- Modify: `src/index.css`

**Step 1: 增加平板横屏辅助样式**

- 新增与平板布局相关的工具类（抽屉层级、过渡、触控安全区）。
- 处理 iPad Safari 安全区（`env(safe-area-inset-*)`）避免按钮贴边误触。

**Step 2: 回归检查**

- 检查不影响桌面与移动端现有样式（尤其 `body` 的 `overflow`、地图层级、modal 层级）。

**Step 3: 提交**

```bash
git add src/index.css
git commit -m "style: add ipad landscape drawer and safe-area styles"
```

### Task 8: 全量验证与回归清单

**Files:**
- Reference: `src/features/lineups/MainView.tsx`
- Reference: `src/apps/shared/SharedMainView.tsx`
- Reference: `src/hooks/useDeviceMode.ts`

**Step 1: 静态检查**

Run: `npx tsc -p tsconfig.json --noEmit`  
Expected: PASS

**Step 2: 构建检查**

Run: `npm run build`  
Expected: PASS（含 `dist/env-config.js` 生成）

**Step 3: 手动矩阵（必须执行）**

- `npm run dev` 后分别验证：
  - `http://localhost:3208/user.html`（个人库）
  - `http://localhost:3208/`（共享库入口）
- 设备矩阵：
  - iPad Air 竖屏：移动布局
  - iPad Air 横屏：平板混合布局
  - 普通手机：移动布局
  - 桌面 1440 宽：桌面布局

**Step 4: 关键回归点**

- URL 参数恢复（`map/agent/lineup`）不回归。
- 地图点击、点位选择、抽屉开合、弹窗关闭都正常。
- 横竖屏切换后，不出现空白地图或错位（Leaflet 依赖 `ResizeObserver`）。

**Step 5: 提交**

```bash
git add -A
git commit -m "test: validate ipad landscape adaptation across personal and shared flows"
```

---

## 方案对比（Brainstorming 输出）

1. 方案 A（最小改动）：仅缩窄左右面板宽度，保留三栏常驻。  
优点：改动少；缺点：地图仍偏小，iPad 横屏体验提升有限。

2. 方案 B（推荐）：平板横屏混合布局（紧凑左栏 + 可开合右抽屉）。  
优点：地图可视面积明显提升、保留桌面功能；缺点：实现复杂度中等。

3. 方案 C（极简）：iPad 横屏直接走移动端。  
优点：实现最快；缺点：不符合“横屏适配”预期，会损失桌面能力。

推荐采用 **方案 B**，并按上述 Task 2~8 执行。
