// 筛选项
export interface FilterItem {
  text: string
  value: string | number | boolean
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
  sorter?: boolean | ((a: Record<string, unknown>, b: Record<string, unknown>) => number)

  // 筛选
  filters?: FilterItem[] | boolean

  // 值类型
  valueType?: 'text' | 'date' | 'dateTime' | 'money' | 'percent' | 'enum' | 'digit' | 'select'

  // 枚举映射
  valueEnum?: Record<
    string,
    { text: string; status?: 'success' | 'error' | 'warning' | 'info' | 'default' }
  >

  // 编辑配置
  editable?: boolean | EditConfig

  // 自定义渲染
  customRender?: (params: {
    text: unknown
    record: Record<string, unknown>
    index: number
  }) => unknown

  // 隐藏选项
  hideInTable?: boolean // 表格中隐藏
  hideInSearch?: boolean // 搜索表单中隐藏
  hideInExport?: boolean // 导出中隐藏

  // 格式化函数
  formatter?: (value: unknown, record: Record<string, unknown>, index: number) => unknown

  // 校验规则（编辑时使用）
  rules?: unknown[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 原生 el-table-column 扩展属性
  [key: string]: any
}

// 编辑配置
export interface EditConfig {
  type?: 'input' | 'select' | 'date' | 'number' | 'textarea' | 'custom'
  options?: Array<{ label: string; value: unknown }>
  props?: Record<string, unknown>
  rules?: unknown[]
  placeholder?: string
}

// 编辑保存参数
export interface EditSaveParams {
  record: Record<string, unknown>
  rowId: string | number
  dataIndex?: string // cell 模式：当前编辑的字段名
  value?: unknown // cell 模式：当前编辑的新值
  values?: Record<string, unknown> // row 模式：整行所有修改字段
}

// 编辑上下文 (provide/inject)
export interface EditableContext {
  editMode?: 'cell' | 'row' | 'batch'
  isEditing: (rowId: string | number, dataIndex?: string) => boolean
  getEditingValue: (rowId: string | number, dataIndex: string) => unknown
  updateEditingValue: (rowId: string | number, dataIndex: string, value: unknown) => void
  startCellEdit: (
    rowId: string | number,
    dataIndex: string,
    record: Record<string, unknown>
  ) => void
  saveCellEdit: () => Promise<void>
  cancelCellEdit: () => void
  startRowEdit: (rowId: string | number, record: Record<string, unknown>) => void
  saveRowEdit: (rowId: string | number) => Promise<void>
  cancelRowEdit: (rowId: string | number) => void
}

// 表格状态
export interface TableState {
  current: number
  pageSize: number
  sorter: Sorter | null
  filters: Record<string, unknown[]>
}

// 列状态
export interface ColumnState {
  order: string[] // 列顺序
  visible: Record<string, boolean> // 列显隐
}

// 请求参数
export interface RequestParams {
  current: number
  pageSize: number
  sortField?: string
  sortOrder?: SortOrder
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 动态筛选参数
  [key: string]: any
}

// 请求返回结果
export interface TableData {
  data: Record<string, unknown>[]
  total: number
  success?: boolean
  message?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 扩展属性
  [key: string]: any
}

// ProTable 组件 Props
export interface ProTableProps {
  // 列配置
  columns: ColumnProps[]

  // 数据请求函数
  request: (params: RequestParams) => Promise<TableData>

  // 行唯一标识
  rowKey?: string | ((record: Record<string, unknown>) => string)

  // 额外请求参数
  params?: Record<string, unknown>

  // 是否显示工具栏
  showToolbar?: boolean

  // 分页配置
  pagination?:
    | boolean
    | {
        enabled?: boolean
        pageSizes?: number[]
        layout?: string
        showQuickJumper?: boolean
        showSizeChanger?: boolean
        showTotal?: boolean | ((total: number) => string)
      }

  // 虚拟滚动配置
  virtualScroll?:
    | boolean
    | {
        enabled?: boolean
        estimatedRowHeight?: number
        buffer?: number
      }

  // 是否同步 URL 状态
  syncUrl?: boolean

  // 编辑模式
  editMode?: 'cell' | 'row' | 'batch'

  // 编辑保存回调 (返回 true 表示成功更新本地数据，false 表示失败回滚)
  onSave?: (params: EditSaveParams) => Promise<boolean>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 原生 el-table 属性透传
  [key: string]: any
}

// 导出选项
export interface ExportOptions {
  filename?: string
  sheetName?: string
  includeHidden?: boolean
  format?: 'xlsx' | 'csv'
  style?: Record<string, unknown>
}
