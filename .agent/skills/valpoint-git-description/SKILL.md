---
name: valpoint-git-description
description: 仅在 ValPoint 项目中使用；当用户输入"git描述"时，根据距离上次提交后的改动生成中文 Git Commit Message，并在生成后同步更新 src/changelog.ts 和 docs/guide/更新日志.md。
---

# ValPoint Git 描述与日志同步

按以下步骤执行：

1. 先确认当前仓库根目录是 `ValPoint`。
   - 运行 `git rev-parse --show-toplevel`。
   - 若结果路径最后一级不是 `ValPoint`，立即停止并提示：此技能仅支持 ValPoint 项目。

2. 收集"距离上次提交后"的改动信息。
   - 运行 `git status --short` 查看新增/修改/删除/未跟踪文件。
   - 运行 `git diff --name-status HEAD` 查看相对 `HEAD` 的文件级变更。
   - 运行 `git diff --stat HEAD` 获取改动规模与概览。
   - 若存在未跟踪文件，必须把其变更意图纳入描述。

3. 基于改动生成中文 Commit Message，保持信息准确、简洁。
   - 第一行写 Summary，使用一句话概括核心改动，格式建议为 `【类型】描述`。
   - 第二行必须为空行。
   - 第三行开始写 Body，按要点逐行展开主要变更、重构、修复或文档更新，每行一个要点。
   - 不编造不存在的改动，不写与当前 diff 无关的内容。

4. 使用生成好的 Commit Message 同步更新 `src/changelog.ts`。
   - 使用本地日期（`YYYY-MM-DD`）作为日志日期。
   - 从 Commit Message 中提取内容：
     - `summaryLine` = 第一行 Summary。
     - `bodyLines` = 第三行开始的非空行集合。
     - `rawLogItems` = `[summaryLine, ...bodyLines]`；若 `bodyLines` 为空，则 `rawLogItems` 仅包含 `summaryLine`。
   - 日志格式标准化（必须执行）：
     - 将 `summaryLine` 中的 conventional 前缀映射为中文类型：
       - `feat` -> `【新增】`
       - `fix` -> `【修复】`
       - `refactor` -> `【重构】`
       - `perf` -> `【优化】`
       - `docs` -> `【文档】`
       - `chore`/`build`/`ci` -> `【运维】`
       - 未命中时默认 `【优化】`
     - 清理 `rawLogItems` 中每一项的编号前缀（如 `1. `、`1) `、`1、`）。
     - 对每一项补齐 `【类型】` 前缀；禁止写入 `feat:`、`fix:` 等英文前缀。
     - 得到标准化的 `newLogItems` 数组。
   - 更新 `src/changelog.ts`（增量更新模式）：
     - 读取 `changelogEntries`。
     - **检查是否已存在同日期条目**：
       - **若存在**：
         - 获取该条目现有的 `items` 列表。
         - 将 `newLogItems` 追加到现有列表的末尾。
         - **去重**：如果追加的内容与现有内容完全一致（文本相同），则不重复添加。
       - **若不存在**：
         - 在数组最前面插入新条目，`items` 为 `newLogItems`。

5. 同时更新 `docs/guide/更新日志.md`（增量同步）。
   - 读取 `docs/guide/更新日志.md` 文件内容。
   - 使用从 Step 4 生成的 `newLogItems`。
   - 构造 Markdown 列表项：每一项前加 `- `，保持原文本。
   - **定位目标日期节**：
     - 查找是否存在 `## YYYY-MM-DD`（如 `## 2025-12-08`）。
     - **若存在**：
       - 在该标题下方追加新的列表项。
       - **去重**：同样执行去重逻辑，避免重复添加相同的行。
     - **若不存在**：
       - 构造新的段落：
         ```markdown
         ## YYYY-MM-DD
         - Item 1
         - Item 2
         ```
       - **插入位置**：找到第一个以 `## 20` 开头的行（现有最新的日期节），插入在其上方。
       - 若找不到任何 `## 20` 开头的行，则追加到文件末尾。

6. 严格遵守输出格式要求。
   - 最终结果只输出一个代码块，便于一键复制。
   - 代码块内必须是纯文本，不使用加粗、图标、列表 markdown 标记等格式修饰。
   - 始终满足结构：Summary / 空行 / Body。
   - 除代码块外，不额外输出解释文字。

7. 若当前没有任何可提交改动，也必须按同一格式返回，明确说明"无变更可提交"，并且不要改动日志文件。

8. 完成后做最小校验。
   - 重新读取 `src/changelog.ts` 和 `docs/guide/更新日志.md`，确认内容已正确追加。
   - 确保没有引入重复项。
