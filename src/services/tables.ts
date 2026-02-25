/**
 * tables - 服务层
 *
 * 模块定位：
 * - 所在层级：服务层
 * - 主要目标：面向数据访问与结果归一化
 *
 * 关键职责：
 * - 对外提供可复用的数据访问函数
 * - 统一处理查询参数、字段映射与错误抛出
 * - 保证上层拿到稳定的数据结构
 *
 * 主要导出：
 * - `TABLE`
 *
 * 依赖关系：
 * - 上游依赖：无显式外部模块依赖
 * - 下游影响：供 hooks/controllers 复用
 */

export const TABLE = {
  lineups: 'valorant_lineups',
  shared: 'valorant_shared',
};
