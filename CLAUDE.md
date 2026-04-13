# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm run dev          # 启动开发服务器 (端口 3000)
npm run build        # 构建库文件 (输出到 dist/protable.{es,umd}.js)
npm run preview      # 预览生产构建
npm run lint         # 运行 ESLint 并自动修复
npm run test         # 运行测试 (监听模式)
npm run test:ui      # 使用 Vitest UI 运行测试
npm run test:coverage # 运行测试并生成覆盖率报告
```

运行单个测试文件：

```bash
npx vitest run path/to/test.spec.ts
```

## 架构概述

ProTable 是一个基于 Vue 3 Composition API 的配置驱动型表格组件，采用 **Hooks 分离关注点** 的架构模式。

### 核心数据流

```
columns (配置) + request (请求函数)
        ↓
   ProTable.vue (协调器)
        ↓
   ┌─────────────────────────────────────┐
   │  useTableState  → 分页/排序/筛选状态
   │  useColumnState → 列显隐/顺序
   │  useUrlSync     → URL ↔ 状态双向绑定
   └─────────────────────────────────────┘
        ↓
   VirtualTable.vue 或 el-table (根据 virtualScroll 配置)
        ↓
   ColumnRenderer.vue (根据 valueType 渲染单元格)
```

### 关键文件

| 文件                      | 职责                                                  |
| ------------------------- | ----------------------------------------------------- |
| `ProTable.vue`            | 主协调器 - 协调 hooks，处理数据请求                   |
| `VirtualTable.vue`        | 自定义虚拟滚动实现，支持万级数据                      |
| `hooks/useTableState.ts`  | 管理 `TableState`: current, pageSize, sorter, filters |
| `hooks/useColumnState.ts` | 管理 `ColumnState`: order[], visible{}                |
| `hooks/useUrlSync.ts`     | URL 双向同步，filters 使用 Base64 编码                |
| `types/index.ts`          | 所有 TypeScript 类型定义                              |
| `utils/export.ts`         | Excel/CSV 导出 (使用 xlsx 库)                         |

### Hook 模式

Hooks 是纯组合式函数，返回状态和设置方法：

```typescript
// useTableState 模式
const { tableState, setTableState, resetTableState } = useTableState(initialState)

// useColumnState 模式
const { columnState, processedColumns, updateColumnVisibility, updateColumnOrder } =
  useColumnState(columns)
```

### 值类型 (valueType)

列配置支持 `valueType` 自动格式化：

- `text` - 默认文本
- `date` / `dateTime` - 日期格式化
- `money` - 货币格式 (¥ 前缀)
- `percent` - 百分比显示
- `enum` - 使用 `valueEnum` 映射显示文本和状态标签
- `digit` - 数字格式化

### 请求函数约定

```typescript
// 必须返回此结构
async function request(params: RequestParams): Promise<TableData> {
  return {
    data: any[],      // 数据行
    total: number,    // 总数 (用于分页)
    success: boolean  // 可选
  }
}

// params 包含: current, pageSize, sortField, sortOrder, 及其他筛选参数
```

### 公开 API (通过 ref 调用)

```typescript
defineExpose({
  refresh, // 重新请求数据
  getTableData, // 获取当前数据
  getTableState, // 获取 TableState 对象
  resetTableState, // 重置为初始状态
})
```

## 开发规范

- **语言**: UI 文本和注释使用中文，代码/变量名使用英文
- **组件**: 统一使用 `<script setup lang="ts">`
- **样式**: 每个组件内使用 scoped CSS
- **路径别名**: `@` 映射到 `src/`
- **库构建**: 入口文件为 `src/components/ProTable/index.ts`

## 添加新功能流程

1. 先在 `types/index.ts` 中添加类型定义
2. 如果涉及状态管理：在 `hooks/` 中创建 hook
3. 在组件中实现功能
4. 如有新增公开 API，更新 `index.ts` 导出
5. 重要功能需在 `examples/` 中添加示例
