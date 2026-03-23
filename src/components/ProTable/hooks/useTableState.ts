import { reactive, toRefs } from 'vue'
import type { TableState } from '../types'

export function useTableState(initialState?: Partial<TableState>) {
  const state = reactive<TableState>({
    current: 1,
    pageSize: 20,
    sorter: null,
    filters: {},
    ...initialState
  })

  // 更新状态（支持部分更新）
  const setTableState = (updates: Partial<TableState>) => {
    Object.assign(state, updates)
  }

  // 重置状态
  const resetTableState = () => {
    state.current = 1
    state.pageSize = 20
    state.sorter = null
    state.filters = {}
  }

  // 获取请求参数
  const getRequestParams = (extraParams?: Record<string, any>) => {
    const params: Record<string, any> = {
      current: state.current,
      pageSize: state.pageSize,
      ...state.filters,
      ...extraParams
    }

    if (state.sorter) {
      params.sortField = state.sorter.field
      params.sortOrder = state.sorter.order
    }

    return params
  }

  return {
    tableState: state,
    setTableState,
    resetTableState,
    getRequestParams,
    ...toRefs(state)
  }
}