// 筛选项
export interface FilterItem {
  text: string
  value: any
  children?: FilterItem[]
}

// 排序方向
export type SortOrder = 'ascend' | 'descend' | null

// 排序器
export interface Sorter {
  field: string
  order: SortOrder
}

// 列配置
export interface ColumnProps {
  dataIndex: string
  title: string
  width?: number
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  ellipsis?: boolean // 超长省略
  copyable?: boolean // 可复制

  // 排序
  sorter?: boolean | ((a: any, b: any) => number)

  // 筛选
  filters?: FilterItem[] | boolean

  // 值类型
  valueType?: 'text' | 'date' | 'dateTime' | 'money' | 'percent' | 'enum' | 'digit' | 'select'

  // 枚举映射
  valueEnum?: Record<string, { text: string; status?: 'success' | 'error' | 'warning' | 'info' | 'default' }>

  // 编辑配置
  editable?: boolean | EditConfig

  // 自定义渲染
  customRender?: (params: { text: any; record: any; index: number }) => any

  // 隐藏选项
  hideInTable?: boolean  // 表格中隐藏
  hideInSearch?: boolean // 搜索表单中隐藏
  hideInExport?: boolean // 导出中隐藏

  // 格式化函数
  formatter?: (value: any, record: any, index: number) => any

  // 校验规则（编辑时使用）
  rules?: any[]

  // 其他原生 el-table-column 属性
  [key: string]: any
}

// 编辑配置
export interface EditConfig {
  type?: 'input' | 'select' | 'date' | 'number' | 'textarea' | 'custom'
  options?: Array<{ label: string; value: any }>
  props?: Record<string, any>
  rules?: any[]
}

// 表格状态
export interface TableState {
  current: number
  pageSize: number
  sorter: Sorter | null
  filters: Record<string, any[]>
}

// 列状态
export interface ColumnState {
  order: string[]  // 列顺序
  visible: Record<string, boolean>  // 列显隐
}

// 请求参数
export interface RequestParams {
  current: number
  pageSize: number
  sortField?: string
  sortOrder?: SortOrder
  [key: string]: any
}

// 请求返回结果
export interface TableData {
  data: any[]
  total: number
  success?: boolean
  message?: string
  [key: string]: any
}

// ProTable 组件 Props
export interface ProTableProps {
  // 列配置
  columns: ColumnProps[]

  // 数据请求函数
  request: (params: RequestParams) => Promise<TableData>

  // 行唯一标识
  rowKey?: string | ((record: any) => string)

  // 额外请求参数
  params?: Record<string, any>

  // 是否显示工具栏
  showToolbar?: boolean

  // 分页配置
  pagination?: boolean | {
    enabled?: boolean
    pageSizes?: number[]
    layout?: string
    showQuickJumper?: boolean
    showSizeChanger?: boolean
    showTotal?: boolean | ((total: number) => string)
  }

  // 虚拟滚动配置
  virtualScroll?: boolean | {
    enabled?: boolean
    estimatedRowHeight?: number
    buffer?: number
  }

  // 是否同步 URL 状态
  syncUrl?: boolean

  // 编辑模式
  editMode?: 'cell' | 'row' | 'batch'

  // 其他原生 el-table 属性
  [key: string]: any
}

// 导出选项
export interface ExportOptions {
  filename?: string
  sheetName?: string
  includeHidden?: boolean
  format?: 'xlsx' | 'csv'
  style?: Record<string, any>
}