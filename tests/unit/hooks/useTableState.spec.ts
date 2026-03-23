import { describe, test, expect } from 'vitest'
import { useTableState } from '../../../src/components/ProTable/hooks/useTableState'
import type { TableState } from '../../../src/components/ProTable/types'

describe('useTableState - 配置化表格状态管理', () => {
  test('应该使用默认状态初始化', () => {
    // 执行
    const { tableState, current, pageSize, sorter, filters } = useTableState()

    // 验证默认值
    expect(tableState.current).toBe(1)
    expect(tableState.pageSize).toBe(20)
    expect(tableState.sorter).toBeNull()
    expect(tableState.filters).toEqual({})

    // 验证响应式属性
    expect(current.value).toBe(1)
    expect(pageSize.value).toBe(20)
    expect(sorter.value).toBeNull()
    expect(filters.value).toEqual({})
  })

  test('应该支持自定义初始状态', () => {
    // 准备
    const initialState: Partial<TableState> = {
      current: 3,
      pageSize: 50,
      sorter: { field: 'name', order: 'ascend' },
      filters: { status: ['active'], category: ['tech'] }
    }

    // 执行
    const { tableState } = useTableState(initialState)

    // 验证
    expect(tableState.current).toBe(3)
    expect(tableState.pageSize).toBe(50)
    expect(tableState.sorter).toEqual({ field: 'name', order: 'ascend' })
    expect(tableState.filters).toEqual({ status: ['active'], category: ['tech'] })
  })

  test('应该支持部分更新状态', () => {
    // 准备
    const { setTableState, tableState } = useTableState()

    // 执行：部分更新
    setTableState({ current: 2 })
    setTableState({ pageSize: 30 })
    setTableState({ sorter: { field: 'age', order: 'descend' } })
    setTableState({ filters: { status: ['active'] } })

    // 验证每次更新都生效且不影响其他属性
    expect(tableState.current).toBe(2)
    expect(tableState.pageSize).toBe(30)
    expect(tableState.sorter).toEqual({ field: 'age', order: 'descend' })
    expect(tableState.filters).toEqual({ status: ['active'] })
  })

  test('应该支持批量更新状态', () => {
    // 准备
    const { setTableState, tableState } = useTableState({
      current: 1,
      pageSize: 20,
      sorter: null,
      filters: {}
    })

    // 执行：批量更新多个属性
    setTableState({
      current: 5,
      pageSize: 100,
      sorter: { field: 'createdAt', order: 'ascend' },
      filters: { department: ['engineering', 'product'] }
    })

    // 验证
    expect(tableState.current).toBe(5)
    expect(tableState.pageSize).toBe(100)
    expect(tableState.sorter).toEqual({ field: 'createdAt', order: 'ascend' })
    expect(tableState.filters).toEqual({ department: ['engineering', 'product'] })
  })

  test('应该支持重置状态', () => {
    // 准备
    const { setTableState, resetTableState, tableState } = useTableState({
      current: 10,
      pageSize: 100,
      sorter: { field: 'name', order: 'descend' },
      filters: { status: ['inactive'], type: ['premium'] }
    })

    // 验证初始状态不是默认值
    expect(tableState.current).toBe(10)
    expect(tableState.pageSize).toBe(100)
    expect(tableState.sorter).not.toBeNull()

    // 执行重置
    resetTableState()

    // 验证已重置为默认值
    expect(tableState.current).toBe(1)
    expect(tableState.pageSize).toBe(20)
    expect(tableState.sorter).toBeNull()
    expect(tableState.filters).toEqual({})
  })

  test('应该生成正确的请求参数', () => {
    // 准备
    const { setTableState, getRequestParams } = useTableState()

    // 设置复杂状态
    setTableState({
      current: 3,
      pageSize: 25,
      sorter: { field: 'age', order: 'descend' },
      filters: { status: ['active', 'pending'], category: ['user'] }
    })

    // 执行
    const params = getRequestParams({ extra: 'param' })

    // 验证请求参数格式
    expect(params).toEqual({
      current: 3,
      pageSize: 25,
      status: ['active', 'pending'],
      category: ['user'],
      sortField: 'age',
      sortOrder: 'descend',
      extra: 'param'
    })
  })

  test('生成请求参数时应处理空排序器', () => {
    // 准备
    const { getRequestParams } = useTableState({
      current: 1,
      pageSize: 20,
      sorter: null,
      filters: {}
    })

    // 执行
    const params = getRequestParams()

    // 验证：没有排序器时不应包含排序字段
    expect(params).toEqual({
      current: 1,
      pageSize: 20
    })
    expect(params.sortField).toBeUndefined()
    expect(params.sortOrder).toBeUndefined()
  })

  test('生成请求参数时应处理空筛选器', () => {
    // 准备
    const { getRequestParams } = useTableState({
      current: 2,
      pageSize: 30,
      sorter: { field: 'name', order: 'ascend' },
      filters: {}
    })

    // 执行
    const params = getRequestParams()

    // 验证：空筛选器不应出现在参数中
    expect(params).toEqual({
      current: 2,
      pageSize: 30,
      sortField: 'name',
      sortOrder: 'ascend'
    })
    expect(params.status).toBeUndefined()
    expect(params.category).toBeUndefined()
  })

  test('生成请求参数时应合并额外参数', () => {
    // 准备
    const { getRequestParams } = useTableState({
      current: 1,
      pageSize: 10
    })

    // 执行：传递额外参数
    const params = getRequestParams({
      keyword: '搜索词',
      dateRange: ['2024-01-01', '2024-01-31'],
      includeArchived: false
    })

    // 验证
    expect(params).toEqual({
      current: 1,
      pageSize: 10,
      keyword: '搜索词',
      dateRange: ['2024-01-01', '2024-01-31'],
      includeArchived: false
    })
  })

  test('额外参数应覆盖状态参数（优先级）', () => {
    // 准备：状态中有一些参数
    const { setTableState, getRequestParams } = useTableState()
    setTableState({
      current: 2,
      pageSize: 20,
      filters: { status: ['active'] }
    })

    // 执行：额外参数中包含相同键
    const params = getRequestParams({
      current: 5, // 覆盖状态中的 current
      extraField: 'extraValue'
    })

    // 验证：额外参数优先级更高
    expect(params.current).toBe(5) // 来自额外参数，不是 2
    expect(params.pageSize).toBe(20) // 来自状态
    expect(params.status).toEqual(['active']) // 来自状态
    expect(params.extraField).toBe('extraValue') // 来自额外参数
  })
})