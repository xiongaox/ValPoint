---
name: valpoint-git-description
description: 仅在 ValPoint 项目中使用；当用户输入“git描述”时，根据距离上次提交后的改动生成中文 Git Commit Message，并在生成后同步更新 src/changelog.ts 与 docs/guide/更新日志.md。
---

# ValPoint Git 描述与日志同步

按以下步骤执行：

1. 先确认当前仓库根目录是 `ValPoint`。
   - 运行 `git rev-parse --show-toplevel`。
   - 若结果路径最后一级不是 `ValPoint`，立即停止并提示：此技能仅支持 ValPoint 项目。

2. 收集“距离上次提交后”的改动信息。
   - 运行 `git status --short` 查看新增/修改/删除/未跟踪文件。
   - 运行 `git diff --name-status HEAD` 查看相对 `HEAD` 的文件级变更。
   - 运行 `git diff --stat HEAD` 获取改动规模与概览。
   - 若存在未跟踪文件，必须把其变更意图纳入描述。

3. 基于改动生成中文 Commit Message，保持信息准确、简洁。
   - 第一行写 Summary，使用一句话概括核心改动，格式建议为 `【类型】描述`。
   - 第二行必须为空行。
   - 第三行开始写 Body，按要点逐行展开主要变更、重构、修复或文档更新，每行一个要点。
   - 不编造不存在的改动，不写与当前 diff 无关的内容。

4. 使用生成好的 Commit Message 同步更新日志文件。
   - 使用本地日期（`YYYY-MM-DD`）作为日志日期。
   - 这是强制写入步骤：无论同日期条目是否已存在、文本是否看起来相似，都必须执行覆盖写入，不允许以“已最新”“已同步”“变更相同”为理由跳过。
   - 从 Commit Message 中提取内容：
     - `summaryLine` = 第一行 Summary。
     - `bodyLines` = 第三行开始的非空行集合。
     - `logItems` = `[summaryLine, ...bodyLines]`；若 `bodyLines` 为空，则 `logItems` 仅包含 `summaryLine`。
   - 日志格式标准化（必须执行）：
     - 日志条目统一使用项目既有风格：`【类型】描述`。
     - 将 `summaryLine` 中的 conventional 前缀映射为中文类型：
       - `feat` -> `【新增】`
       - `fix` -> `【修复】`
       - `refactor` -> `【重构】`
       - `perf` -> `【优化】`
       - `docs` -> `【文档】`
       - `chore`/`build`/`ci` -> `【运维】`
       - 未命中时默认 `【优化】`
     - 清理 `summaryLine` 与 `bodyLines` 的编号前缀（如 `1. `、`1) `、`1、`）后再写入日志。
     - 对 `logItems` 中每一项补齐 `【类型】` 前缀；禁止写入 `feat:`、`fix:` 等英文前缀。
     - `src/changelog.ts` 与 `docs/guide/更新日志.md` 两个文件必须写入完全相同的 `logItems` 文本序列。
   - 更新 `src/changelog.ts`：
     - 若 `changelogEntries` 已存在同日期条目，则覆盖该条目的 `items` 为 `logItems`。
     - 若不存在同日期条目，则在数组最前面插入新条目，`items` 为 `logItems`。
   - 更新 `docs/guide/更新日志.md`：
     - 若已存在同日期标题（`## YYYY-MM-DD`），则替换该日期下的条目内容为 `logItems`。
     - 若不存在该日期标题，则在文件顶部说明段后插入新日期节，并写入 `logItems`（每行一个 `- ` 列表项）。
   - 两个文件中的条目内容必须保持一致、同序。

5. 严格遵守输出格式要求。
   - 最终结果只输出一个代码块，便于一键复制。
   - 代码块内必须是纯文本，不使用加粗、图标、列表 markdown 标记等格式修饰。
   - 始终满足结构：Summary / 空行 / Body。
   - 除代码块外，不额外输出解释文字。

6. 若当前没有任何可提交改动，也必须按同一格式返回，明确说明“无变更可提交”，并且不要改动日志文件。

7. 完成后做最小校验。
   - 重新读取 `src/changelog.ts` 与 `docs/guide/更新日志.md` 的目标日期节，确认两个文件中的条目内容与 `logItems` 完全一致。
   - 若不一致，立即再次覆盖，直到一致后再输出结果。
