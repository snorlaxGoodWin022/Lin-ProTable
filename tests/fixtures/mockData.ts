import type { ColumnProps } from '../../src/components/ProTable/types'

// 模拟表格数据
export const mockTableData = [
  { id: 1, name: '张三', age: 25, email: 'zhangsan@example.com', status: 'active', createdAt: '2024-01-15T10:30:00Z' },
  { id: 2, name: '李四', age: 30, email: 'lisi@example.com', status: 'inactive', createdAt: '2024-01-16T14:20:00Z' },
  { id: 3, name: '王五', age: 28, email: 'wangwu@example.com', status: 'active', createdAt: '2024-01-17T09:15:00Z' },
  { id: 4, name: '赵六', age: 35, email: 'zhaoliu@example.com', status: 'inactive', createdAt: '2024-01-18T16:45:00Z' },
  { id: 5, name: '孙七', age: 22, email: 'sunqi@example.com', status: 'active', createdAt: '2024-01-19T11:10:00Z' }
]

// 模拟大数据（用于虚拟滚动测试）
export const mockLargeData = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `用户 ${i + 1}`,
  age: Math.floor(Math.random() * 50) + 18,
  email: `user${i + 1}@example.com`,
  status: Math.random() > 0.5 ? 'active' : 'inactive',
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
}))

// 基础列配置
export const basicColumns: ColumnProps[] = [
  { dataIndex: 'id', title: 'ID', width: 80, sorter: true },
  { dataIndex: 'name', title: '姓名', width: 150, sorter: true, ellipsis: true },
  { dataIndex: 'age', title: '年龄', width: 100, valueType: 'digit', sorter: true },
  { dataIndex: 'email', title: '邮箱', width: 200, ellipsis: true },
  { dataIndex: 'status', title: '状态', width: 100, valueType: 'enum' }
]

// 完整功能列配置
export const fullFeatureColumns: ColumnProps[] = [
  {
    dataIndex: 'id',
    title: 'ID',
    width: 80,
    sorter: true,
    fixed: 'left' as const
  },
  {
    dataIndex: 'name',
    title: '姓名',
    width: 150,
    sorter: true,
    ellipsis: true,
    copyable: true,
    filters: [
      { text: '张', value: '张' },
      { text: '李', value: '李' },
      { text: '王', value: '王' }
    ]
  },
  {
    dataIndex: 'age',
    title: '年龄',
    width: 100,
    valueType: 'digit' as const,
    sorter: true,
    editable: true
  },
  {
    dataIndex: 'email',
    title: '邮箱',
    width: 200,
    ellipsis: true,
    hideInSearch: true
  },
  {
    dataIndex: 'status',
    title: '状态',
    width: 100,
    valueType: 'enum' as const,
    valueEnum: {
      active: { text: '活跃', status: 'success' },
      inactive: { text: '禁用', status: 'info' }
    },
    filters: [
      { text: '活跃', value: 'active' },
      { text: '禁用', value: 'inactive' }
    ],
    hideInExport: true
  },
  {
    dataIndex: 'createdAt',
    title: '创建时间',
    width: 180,
    valueType: 'dateTime' as const,
    sorter: true
  },
  {
    dataIndex: 'action',
    title: '操作',
    width: 180,
    fixed: 'right' as const,
    customRender: () => '操作按钮'
  }
]

// 自定义渲染列配置
export const customRenderColumns: ColumnProps[] = [
  {
    dataIndex: 'name',
    title: '自定义姓名',
    width: 150,
    customRender: ({ text, record }) => `${text} (ID: ${record.id})`
  },
  {
    dataIndex: 'status',
    title: '自定义状态',
    width: 120,
    customRender: ({ text }) => {
      if (text === 'active') return '✅ 活跃'
      if (text === 'inactive') return '❌ 禁用'
      return text
    }
  }
]

// 错误配置（用于测试错误处理）
export const invalidColumns = [
  { dataIndex: 'id', title: 'ID' }, // 缺少必需属性（实际上 dataIndex 和 title 是必需的，这个配置是有效的）
  { dataIndex: 'name' }, // 缺少 title
  { title: '年龄' }, // 缺少 dataIndex
  { dataIndex: 'invalid', title: '无效列', width: 'invalid' } // 无效的 width 类型
] as any