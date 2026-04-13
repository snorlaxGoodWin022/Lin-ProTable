# ProTable 高级表格组件

基于 Vue 3 + Element Plus 的高性能、可配置表格组件，提供配置化开发、虚拟滚动、状态同步等高级功能。

## ✨ 特性

- **配置化开发**：通过 JSON 配置生成完整表格，减少重复代码
- **虚拟滚动**：支持大数据量流畅展示（万级数据）
- **状态同步**：表格状态与 URL 双向绑定，支持链接分享
- **列设置**：拖拽排序、显示/隐藏列
- **数据导出**：支持 Excel/CSV 导出，自动格式化数据
- **行内编辑**：支持单元格编辑和整行编辑模式
- **类型安全**：完整的 TypeScript 类型定义
- **插件化扩展**：支持功能插件按需加载

## 📦 安装

```bash
# 安装依赖
npm install element-plus @element-plus/icons-vue vuedraggable-next xlsx lodash-es
```

## 🚀 快速开始

### 1. 导入组件

```javascript
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import ProTable from './components/ProTable'

const app = createApp(App)
app.use(ElementPlus)
app.component('ProTable', ProTable)
```

### 2. 基础使用

```vue
<template>
  <ProTable :columns="columns" :request="fetchData" row-key="id" show-toolbar />
</template>

<script setup>
import ProTable from './components/ProTable'

const columns = [
  {
    dataIndex: 'name',
    title: '姓名',
    width: 150,
    sorter: true,
    ellipsis: true,
  },
  {
    dataIndex: 'age',
    title: '年龄',
    width: 100,
    valueType: 'digit',
    sorter: true,
  },
  {
    dataIndex: 'status',
    title: '状态',
    valueType: 'enum',
    valueEnum: {
      active: { text: '活跃', status: 'success' },
      inactive: { text: '禁用', status: 'info' },
    },
  },
]

async function fetchData(params) {
  const response = await api.getUserList(params)
  return {
    data: response.data.list,
    total: response.data.total,
    success: true,
  }
}
</script>
```

## 🔧 核心功能

### 列配置

```typescript
interface ColumnProps {
  dataIndex: string // 字段名
  title: string // 列标题
  width?: number // 列宽
  fixed?: 'left' | 'right' // 固定列
  sorter?: boolean // 是否可排序
  filters?: FilterItem[] // 筛选选项
  valueType?: 'date' | 'money' | 'percent' | 'enum' | 'digit' // 值类型
  valueEnum?: Record<string, { text: string; status?: string }> // 枚举映射
  editable?: boolean // 是否可编辑
  ellipsis?: boolean // 超长省略
  copyable?: boolean // 可复制
  customRender?: (params: { text: any; record: any; index: number }) => any
}
```

### 虚拟滚动

```vue
<ProTable
  :virtual-scroll="{
    enabled: true,
    estimatedRowHeight: 55,
    buffer: 5,
  }"
  :request="fetchLargeData"
  :pagination="false"
/>
```

### URL 状态同步

```vue
<ProTable :sync-url="true" :columns="columns" :request="fetchData" />
```

URL 格式示例：

```
/users?current=2&pageSize=20&sorter=age:desc&filters=eyJzdGF0dXMiOlsiYWN0aXZlIl19
```

### 数据导出

```javascript
import { exportToExcel, exportToCsv } from './components/ProTable'

// 手动导出
exportToExcel(columns, data, '导出数据.xlsx')

// 通过工具栏按钮自动导出
```

### 列设置

- 拖拽调整列顺序
- 勾选显示/隐藏列
- 设置保存到 localStorage
- 支持列预设

## 📁 项目结构

```
src/components/ProTable/
├── ProTable.vue              # 主组件
├── VirtualTable.vue          # 虚拟滚动表格
├── Toolbar.vue               # 工具栏
├── ColumnSetting.vue         # 列设置面板
├── ColumnRenderer.vue        # 列渲染器
├── index.ts                  # 组件导出
├── types/
│   └── index.ts             # 类型定义
├── hooks/
│   ├── useTableState.ts     # 表格状态管理
│   ├── useColumnState.ts    # 列状态管理
│   └── useUrlSync.ts        # URL 状态同步
└── utils/
    ├── export.ts            # 导出工具
    └── formatter.ts         # 格式化工具
```

## 📖 API

### ProTable Props

| 参数          | 说明              | 类型                           | 默认值    |
| ------------- | ----------------- | ------------------------------ | --------- |
| columns       | 列配置数组        | ColumnProps[]                  | required  |
| request       | 数据请求函数      | (params) => Promise<TableData> | required  |
| rowKey        | 行唯一标识        | string \| (record) => string   | 'id'      |
| showToolbar   | 是否显示工具栏    | boolean                        | true      |
| pagination    | 分页配置          | boolean \| object              | true      |
| virtualScroll | 虚拟滚动配置      | boolean \| object              | false     |
| syncUrl       | 是否同步 URL 状态 | boolean                        | true      |
| editMode      | 编辑模式          | 'cell' \| 'row' \| 'batch'     | undefined |

### 事件

| 事件名    | 说明               | 参数       |
| --------- | ------------------ | ---------- |
| change    | 表格状态变化时触发 | TableState |
| row-click | 点击行时触发       | row, event |

### 方法（通过 ref 调用）

```javascript
const tableRef = ref()

// 刷新表格
tableRef.value.refresh()

// 获取表格数据
tableRef.value.getTableData()

// 获取表格状态
tableRef.value.getTableState()

// 重置表格状态
tableRef.value.resetTableState()
```

## 🎯 性能优化

- **虚拟滚动**：只渲染可见区域的行
- **分片渲染**：大数据量时分批渲染
- **请求防抖**：搜索输入防抖 300ms
- **数据缓存**：相同参数 5 分钟缓存
- **组件懒加载**：工具栏功能按需加载
- **选择性重渲染**：使用 shallowRef 和 memo

## 🔧 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 运行示例
npm run dev

# 构建组件库
npm run build
```

### 添加新功能

1. 在 `types/index.ts` 中添加类型定义
2. 在对应组件中实现功能
3. 在 `hooks/` 中添加相关逻辑
4. 更新示例和文档

## 📝 示例

查看 `examples/` 目录中的完整示例：

- [基础用法](examples/BasicUsage.vue)
- 虚拟滚动示例
- URL 状态同步示例

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
