import { ref, computed, watch, toRaw } from 'vue'
import type { Ref } from 'vue'
import type { RowSelectionOptions } from '../types'

interface UseRowSelectionOptions {
  rowSelection: Ref<RowSelectionOptions | false | undefined>
  rowKey: string | ((record: Record<string, unknown>) => string)
  dataSource: Ref<Record<string, unknown>[]>
}

export function useRowSelection({ rowSelection, rowKey, dataSource }: UseRowSelectionOptions) {
  const selectedRowKeys = ref<(string | number)[]>([])
  const selectedRowsMap = ref<Map<string | number, Record<string, unknown>>>(new Map())

  // 获取行的 key 值
  function getRowKeyValue(row: Record<string, unknown>): string | number {
    if (typeof rowKey === 'function') {
      return rowKey(row)
    }
    return row[rowKey] as string | number
  }

  // 当前选中配置
  const selectionConfig = computed(() => {
    if (!rowSelection.value || rowSelection.value === false) return null
    return rowSelection.value
  })

  // 获取行的禁用状态
  function getRowDisabled(row: Record<string, unknown>): boolean {
    if (!selectionConfig.value?.getCheckboxProps) return false
    return selectionConfig.value.getCheckboxProps(row).disabled === true
  }

  // 当前数据源中可选的行
  const selectableRows = computed(() => {
    return dataSource.value.filter((row) => !getRowDisabled(row))
  })

  // 判断行是否选中
  function isSelected(row: Record<string, unknown>): boolean {
    const key = getRowKeyValue(row)
    return selectedRowKeys.value.includes(key)
  }

  // 是否全选
  const isAllSelected = computed(() => {
    if (selectableRows.value.length === 0) return false
    return selectableRows.value.every((row) => isSelected(row))
  })

  // 是否半选
  const isIndeterminate = computed(() => {
    if (selectableRows.value.length === 0) return false
    const someSelected = selectableRows.value.some((row) => isSelected(row))
    return someSelected && !isAllSelected.value
  })

  // 获取选中的行数据
  const selectedRows = computed(() => {
    return selectedRowKeys.value
      .map((key) => selectedRowsMap.value.get(key))
      .filter((row): row is Record<string, unknown> => row !== undefined)
  })

  // 触发 onChange
  function triggerChange() {
    if (selectionConfig.value?.onChange) {
      selectionConfig.value.onChange([...selectedRowKeys.value], toRaw(selectedRows.value))
    }
  }

  // 选中单行
  function selectRow(row: Record<string, unknown>) {
    const key = getRowKeyValue(row)
    if (getRowDisabled(row)) return

    if (selectionConfig.value?.type === 'radio') {
      selectedRowKeys.value = [key]
      selectedRowsMap.value = new Map([[key, row]])
    } else {
      if (!selectedRowKeys.value.includes(key)) {
        selectedRowKeys.value = [...selectedRowKeys.value, key]
        selectedRowsMap.value.set(key, row)
      }
    }
    triggerChange()
  }

  // 批量选中行
  function selectRows(rows: Record<string, unknown>[]) {
    if (selectionConfig.value?.type === 'radio') {
      if (rows.length > 0) {
        const row = rows[rows.length - 1]
        const key = getRowKeyValue(row)
        selectedRowKeys.value = [key]
        selectedRowsMap.value = new Map([[key, row]])
      }
      triggerChange()
      return
    }

    const newKeys: (string | number)[] = []
    const newMap = new Map<string | number, Record<string, unknown>>()
    for (const row of rows) {
      if (getRowDisabled(row)) continue
      const key = getRowKeyValue(row)
      newKeys.push(key)
      newMap.set(key, row)
    }
    selectedRowKeys.value = newKeys
    selectedRowsMap.value = newMap
    triggerChange()
  }

  // 切换行选中
  function toggleRow(row: Record<string, unknown>) {
    const key = getRowKeyValue(row)
    if (getRowDisabled(row)) return

    if (selectionConfig.value?.type === 'radio') {
      selectedRowKeys.value = [key]
      selectedRowsMap.value = new Map([[key, row]])
      triggerChange()
      return
    }

    if (selectedRowKeys.value.includes(key)) {
      selectedRowKeys.value = selectedRowKeys.value.filter((k) => k !== key)
      selectedRowsMap.value.delete(key)
    } else {
      selectedRowKeys.value = [...selectedRowKeys.value, key]
      selectedRowsMap.value.set(key, row)
    }
    triggerChange()
  }

  // 全选/取消全选
  function toggleAll() {
    if (isAllSelected.value) {
      // 取消全选当前页可选行
      const disabledKeys = new Set(
        dataSource.value.filter((row) => getRowDisabled(row)).map((row) => getRowKeyValue(row))
      )
      selectedRowKeys.value = selectedRowKeys.value.filter((key) => disabledKeys.has(key))
      // 清理 map
      const newMap = new Map<string | number, Record<string, unknown>>()
      for (const key of selectedRowKeys.value) {
        const row = selectedRowsMap.value.get(key)
        if (row) newMap.set(key, row)
      }
      selectedRowsMap.value = newMap
    } else {
      // 全选当前页可选行
      for (const row of selectableRows.value) {
        const key = getRowKeyValue(row)
        if (!selectedRowKeys.value.includes(key)) {
          selectedRowKeys.value = [...selectedRowKeys.value, key]
        }
        selectedRowsMap.value.set(key, row)
      }
    }
    triggerChange()
  }

  // 清空选择
  function clearSelection() {
    selectedRowKeys.value = []
    selectedRowsMap.value = new Map()
    triggerChange()
  }

  // 从当前页 selection 同步（用于 el-table @selection-change）
  // el-table 返回的是当前页所有选中的行，需要与跨页的选中状态合并
  function syncFromPageSelection(
    pageSelection: Record<string, unknown>[],
    currentPageRows: Record<string, unknown>[]
  ) {
    const currentPageKeys = new Set(currentPageRows.map((row) => getRowKeyValue(row)))
    const pageSelectedKeys = new Set(pageSelection.map((row) => getRowKeyValue(row)))

    // 保留非当前页的已选 key
    const otherPageKeys = selectedRowKeys.value.filter((key) => !currentPageKeys.has(key))
    const newKeys = [...otherPageKeys, ...pageSelectedKeys]
    selectedRowKeys.value = newKeys

    // 更新 map
    const newMap = new Map<string | number, Record<string, unknown>>()
    for (const key of otherPageKeys) {
      const row = selectedRowsMap.value.get(key)
      if (row) newMap.set(key, row)
    }
    for (const row of pageSelection) {
      newMap.set(getRowKeyValue(row), row)
    }
    selectedRowsMap.value = newMap

    triggerChange()
  }

  // 受控模式同步
  watch(
    () => selectionConfig.value?.selectedRowKeys,
    (keys) => {
      if (keys !== undefined) {
        selectedRowKeys.value = [...keys]
        // 清理不在 keys 中的 map 条目
        const newMap = new Map<string | number, Record<string, unknown>>()
        for (const key of keys) {
          const row = selectedRowsMap.value.get(key)
          if (row) newMap.set(key, row)
        }
        selectedRowsMap.value = newMap
      }
    }
  )

  // 配置变化时清空选择
  watch(
    () => selectionConfig.value?.type,
    () => {
      clearSelection()
    }
  )

  return {
    selectedRowKeys,
    selectedRows,
    isAllSelected,
    isIndeterminate,
    isSelected,
    getRowDisabled,
    selectionConfig,
    selectRow,
    selectRows,
    toggleRow,
    toggleAll,
    clearSelection,
    syncFromPageSelection,
  }
}
