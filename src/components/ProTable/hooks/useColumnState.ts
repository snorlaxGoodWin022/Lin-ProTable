import { ref, computed } from 'vue'
import type { ColumnProps, ColumnState } from '../types'

export function useColumnState(columns: ColumnProps[], initialState?: Partial<ColumnState>) {
  // 初始列顺序
  const initialOrder = columns.map((col) => col.dataIndex)
  const initialVisible = columns.reduce(
    (acc, col) => {
      acc[col.dataIndex] = !col.hideInTable
      return acc
    },
    {} as Record<string, boolean>
  )

  // 列状态
  const columnState = ref<ColumnState>({
    order: [...initialOrder],
    visible: { ...initialVisible },
    widths: {},
    ...initialState,
  })

  // 处理后的列配置（合并动态宽度）
  const processedColumns = computed(() => {
    return columnState.value.order
      .map((key) => {
        const col = columns.find((c) => c.dataIndex === key)
        if (!col || !columnState.value.visible[col.dataIndex]) return null
        // 如果有拖拽后的动态宽度，覆盖原始 width
        const dynamicWidth = columnState.value.widths[col.dataIndex]
        if (dynamicWidth !== undefined) {
          return { ...col, width: dynamicWidth }
        }
        return col
      })
      .filter((col) => col !== null)
  })

  // 更新列状态
  const updateColumnState = (updates: Partial<ColumnState>) => {
    if (updates.order) {
      columnState.value.order = updates.order
    }
    if (updates.visible) {
      columnState.value.visible = {
        ...columnState.value.visible,
        ...updates.visible,
      }
    }
  }

  // 更新单列宽度（拖拽后调用）
  const updateColumnWidth = (dataIndex: string, width: number) => {
    columnState.value.widths = {
      ...columnState.value.widths,
      [dataIndex]: width,
    }
  }

  // 重置列状态
  const resetColumnState = () => {
    columnState.value.order = [...initialOrder]
    columnState.value.visible = { ...initialVisible }
    columnState.value.widths = {}
  }

  // 切换列显隐
  const toggleColumnVisible = (dataIndex: string, visible?: boolean) => {
    if (visible !== undefined) {
      columnState.value.visible[dataIndex] = visible
    } else {
      columnState.value.visible[dataIndex] = !columnState.value.visible[dataIndex]
    }
  }

  // 移动列顺序
  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newOrder = [...columnState.value.order]
    const [removed] = newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, removed)
    columnState.value.order = newOrder
  }

  return {
    columnState,
    processedColumns,
    updateColumnState,
    updateColumnWidth,
    resetColumnState,
    toggleColumnVisible,
    moveColumn,
  }
}
