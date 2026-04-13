import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { debounce } from 'lodash-es'
import type { TableState } from '../types'

export function useUrlSync(tableState: TableState, onStateChange?: () => void) {
  const route = useRoute()
  const router = useRouter()

  // 从 URL 解析状态
  const parseStateFromUrl = () => {
    const { query } = route

    const state: Partial<TableState> = {}

    if (query.current) {
      state.current = Number(query.current)
    }

    if (query.pageSize) {
      state.pageSize = Number(query.pageSize)
    }

    if (query.sorter && typeof query.sorter === 'string') {
      const [field, order] = query.sorter.split(':')
      if (field && order && (order === 'ascend' || order === 'descend')) {
        state.sorter = { field, order }
      }
    }

    if (query.filters && typeof query.filters === 'string') {
      try {
        state.filters = JSON.parse(atob(query.filters))
      } catch (e) {
        console.error('解析筛选参数失败', e)
      }
    }

    return state
  }

  // 状态序列化到 URL
  const serializeStateToUrl = (state: TableState) => {
    const query: Record<string, unknown> = {
      current: state.current,
      pageSize: state.pageSize,
    }

    if (state.sorter) {
      query.sorter = `${state.sorter.field}:${state.sorter.order}`
    }

    if (Object.keys(state.filters).length > 0) {
      query.filters = btoa(JSON.stringify(state.filters))
    }

    return query
  }

  // 初始化：从 URL 读取状态
  const initFromUrl = () => {
    const urlState = parseStateFromUrl()
    Object.assign(tableState, urlState)

    // 触发数据加载
    if (onStateChange) {
      onStateChange()
    }
  }

  // 状态变化时同步到 URL（防抖）
  const syncToUrl = debounce((state: TableState) => {
    const query = serializeStateToUrl(state)
    router.replace({ query })
  }, 300)

  // 监听状态变化
  watch(
    () => ({ ...tableState }),
    (newState) => {
      syncToUrl(newState)
    },
    { deep: true }
  )

  // 清空 URL 参数
  const clearUrlState = () => {
    router.replace({ query: {} })
  }

  return {
    initFromUrl,
    clearUrlState,
  }
}
