import { describe, test, expect } from 'vitest'
import { useColumnState } from '../../../src/components/ProTable/hooks/useColumnState'
import { basicColumns, fullFeatureColumns } from '../../fixtures/mockData'
import type { ColumnProps } from '../../../src/components/ProTable/types'

describe('useColumnState - 配置化表格列状态管理', () => {
  test('应该正确初始化列状态', () => {
    // 准备
    const columns: ColumnProps[] = basicColumns

    // 执行
    const { columnState, processedColumns } = useColumnState(columns)

    // 验证
    expect(columnState.value.order).toEqual(['id', 'name', 'age', 'email', 'status'])
    expect(columnState.value.visible).toEqual({
      id: true,
      name: true,
      age: true,
      email: true,
      status: true,
    })

    // 处理后的列应该与原始列顺序一致
    expect(processedColumns.value.map((col) => col?.dataIndex)).toEqual([
      'id',
      'name',
      'age',
      'email',
      'status',
    ])
    expect(processedColumns.value).toHaveLength(5)
  })

  test('应该处理 hideInTable 配置', () => {
    // 准备：设置一些列隐藏
    const columns: ColumnProps[] = [
      { dataIndex: 'id', title: 'ID', hideInTable: false },
      { dataIndex: 'name', title: '姓名', hideInTable: true },
      { dataIndex: 'age', title: '年龄', hideInTable: false },
    ]

    // 执行
    const { columnState, processedColumns } = useColumnState(columns)

    // 验证
    expect(columnState.value.visible).toEqual({
      id: true,
      name: false,
      age: true,
    })

    // 隐藏的列不应该出现在处理后的列中
    expect(processedColumns.value.map((col) => col?.dataIndex)).toEqual(['id', 'age'])
  })

  test('应该支持更新列显隐状态', () => {
    // 准备
    const columns: ColumnProps[] = basicColumns
    const { toggleColumnVisible, columnState } = useColumnState(columns)

    // 执行：切换列的显示/隐藏
    toggleColumnVisible('id', false)
    toggleColumnVisible('name') // 切换

    // 验证
    expect(columnState.value.visible.id).toBe(false)
    expect(columnState.value.visible.name).toBe(false) // 从 true 切换到 false
    expect(columnState.value.visible.age).toBe(true) // 保持不变
  })

  test('应该支持拖拽调整列顺序', () => {
    // 准备
    const columns: ColumnProps[] = basicColumns
    const { moveColumn, columnState, processedColumns } = useColumnState(columns)

    // 执行：将第一列移动到第三列位置
    moveColumn(0, 2)

    // 验证列顺序已更新
    expect(columnState.value.order).toEqual(['name', 'age', 'id', 'email', 'status'])

    // 验证处理后的列也按新顺序排列
    expect(processedColumns.value.map((col) => col?.dataIndex)).toEqual([
      'name',
      'age',
      'id',
      'email',
      'status',
    ])
  })

  test('应该支持批量更新列状态', () => {
    // 准备
    const columns: ColumnProps[] = basicColumns
    const { updateColumnState, columnState } = useColumnState(columns)

    // 执行：更新列顺序和显隐状态
    updateColumnState({
      order: ['status', 'email', 'age', 'name', 'id'],
      visible: { id: false, name: false },
    })

    // 验证
    expect(columnState.value.order).toEqual(['status', 'email', 'age', 'name', 'id'])
    expect(columnState.value.visible.id).toBe(false)
    expect(columnState.value.visible.name).toBe(false)
    expect(columnState.value.visible.age).toBe(true)
  })

  test('应该支持重置列状态', () => {
    // 准备
    const columns: ColumnProps[] = basicColumns
    const { updateColumnState, resetColumnState, columnState } = useColumnState(columns)

    // 执行：先修改状态，然后重置
    updateColumnState({
      order: ['status', 'id', 'name'],
      visible: { id: false, age: false },
    })

    // 验证修改生效
    expect(columnState.value.order).toEqual(['status', 'id', 'name'])
    expect(columnState.value.visible.id).toBe(false)

    // 执行重置
    resetColumnState()

    // 验证状态已重置为初始值
    expect(columnState.value.order).toEqual(['id', 'name', 'age', 'email', 'status'])
    expect(columnState.value.visible.id).toBe(true)
    expect(columnState.value.visible.age).toBe(true)
  })

  test('应该正确处理全功能列配置', () => {
    // 准备
    const columns: ColumnProps[] = fullFeatureColumns

    // 执行
    const { processedColumns } = useColumnState(columns)

    // 验证所有列都被正确处理
    expect(processedColumns.value).toHaveLength(7)

    // 验证列配置被正确传递
    const idColumn = processedColumns.value.find((col) => col?.dataIndex === 'id')
    expect(idColumn).toBeDefined()
    expect(idColumn?.title).toBe('ID')
    expect(idColumn?.sorter).toBe(true)
    expect(idColumn?.fixed).toBe('left')

    const statusColumn = processedColumns.value.find((col) => col?.dataIndex === 'status')
    expect(statusColumn).toBeDefined()
    expect(statusColumn?.valueType).toBe('enum')
    expect(statusColumn?.valueEnum).toEqual({
      active: { text: '活跃', status: 'success' },
      inactive: { text: '禁用', status: 'info' },
    })
  })

  test('应该过滤隐藏的列（hideInTable = true）', () => {
    // 准备：创建包含隐藏列的配置
    const columns: ColumnProps[] = [
      { dataIndex: 'id', title: 'ID', hideInTable: false },
      { dataIndex: 'secret', title: '秘密列', hideInTable: true },
      { dataIndex: 'name', title: '姓名', hideInTable: false },
      { dataIndex: 'internal', title: '内部列', hideInTable: true },
    ]

    // 执行
    const { processedColumns } = useColumnState(columns)

    // 验证：只有非隐藏列出现在处理后的列中
    expect(processedColumns.value.map((col) => col?.dataIndex)).toEqual(['id', 'name'])
    expect(processedColumns.value).toHaveLength(2)
  })
})
