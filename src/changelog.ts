/**
 * changelog - changelog
 *
 * 职责：
 * - 承载changelog相关的模块实现。
 * - 组织内部依赖与导出接口。
 * - 为上层功能提供支撑。
 */

type ChangelogItem = string | { text: string; children?: string[] };

export const changelogEntries: { date: string; items: ChangelogItem[] }[] = [
  {
    date: '2026-02-09',
    items: [
      '【运维】整合 AI 规则文件并新增 git描述 技能',
      '【运维】将 data 目录纳入版本控制',
      '【新增】新增亚海悬城/猎枭地图点位数据',
      '【优化】清理测试点位图片',
    ],
  },
  {
    date: '2026-02-05',
    items: [
      '【新增】迁移地图池状态功能，对接远程 API 实现状态实时同步',
      '【优化】MapPickerModal 支持显示"在池/回归/轮出"状态角标',
      '【新增】新增 public/log.html 独立日志页面，替代 Wiki 并适配深色主题',
      '【优化】ChangelogModal 仅展示最近详情，提供完整日志入口',
      '【重构】清理 src/changelog.ts 历史数据，同步 docker_local 分支记录',
    ],
  },
  {
    date: '2026-02-04',
    items: [
      '【新增】迁移地图池状态功能，对接远程 API 显示"在池/回归/轮出"状态',
    ],
  },
  {
    date: '2026-02-02',
    items: [
      '【新增】完善 Docker 发布自动化流程与部署文档',
      '【优化】服务端支持静态文件服务，修复容器内图片显示问题',
      '【优化】简化 docker-compose 配置，统一端口映射',
      '【文档】重写 README，新增 Docker Hub 发布指南',
    ],
  },
  {
    date: '2026-02-01',
    items: [
      '【重构】深度清理废弃逻辑与依赖，优化本地版架构',
      '【重构】移除 Supabase 依赖，扁平化项目结构',
      '【优化】优化编辑器 UI，实现图片物理删除',
      '【修复】修复点位批量删除及导入导出元数据丢失问题',
      '【新增】用户昵称持久化存储及导出元数据同步',
      '【优化】优化图片存储层级结构与命名规范',
    ],
  },
];
