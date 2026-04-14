import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { Ref } from 'vue'
import type { EditableContext, EditSaveParams } from '../types'

interface EditingCell {
  rowId: string | number
  dataIndex: string
}

export function useEditable(options: {
  editMode: Ref<'cell' | 'row' | 'batch' | undefined>
  onSave?: (params: EditSaveParams) => Promise<boolean>
  onBatchSave?: (params: EditSaveParams) => Promise<boolean>
  getRecordByKey: (rowId: string | number) => Record<string, unknown> | undefined
  dataSource: Ref<Record<string, unknown>[]>
  rowKey: string | ((record: Record<string, unknown>) => string)
}) {
  const { editMode, onSave, onBatchSave, getRecordByKey, dataSource, rowKey } = options

  // 当前编辑的单元格 (cell 模式)
  const editingCell = ref<EditingCell | null>(null)

  // 正在编辑的行 key 集合 (row 模式)
  const editingRowKeys = reactive(new Set<string | number>())

  // 编辑中的值缓存 key = rowId, value = { [dataIndex]: value }
  const editingValues = reactive(new Map<string | number, Record<string, unknown>>())

  // 原始值 (用于回滚)
  const originalValues = reactive(new Map<string | number, Record<string, unknown>>())

  // 通过 rowKey 查找数据行索引
  function findRowIndex(rowId: string | number): number {
    return dataSource.value.findIndex((row) => {
      const key = typeof rowKey === 'function' ? rowKey(row) : row[rowKey]
      return String(key) === String(rowId)
    })
  }

  // 更新 dataSource 中单个字段
  function updateDataSourceField(rowId: string | number, dataIndex: string, value: unknown) {
    const index = findRowIndex(rowId)
    if (index !== -1) {
      dataSource.value[index][dataIndex] = value
    }
  }

  // 更新 dataSource 中整行多个字段
  function updateDataSourceRecord(rowId: string | number, values: Record<string, unknown>) {
    const index = findRowIndex(rowId)
    if (index !== -1) {
      Object.keys(values).forEach((key) => {
        dataSource.value[index][key] = values[key]
      })
    }
  }

  // 判断是否编辑态
  function isEditing(rowId: string | number, dataIndex?: string): boolean {
    if (!editMode.value) return false

    if (editMode.value === 'cell') {
      if (!editingCell.value) return false
      if (dataIndex) {
        return editingCell.value.rowId === rowId && editingCell.value.dataIndex === dataIndex
      }
      return editingCell.value.rowId === rowId
    }

    if (editMode.value === 'row' || editMode.value === 'batch') {
      return editingRowKeys.has(rowId)
    }

    return false
  }

  // 获取编辑值
  function getEditingValue(rowId: string | number, dataIndex: string): unknown {
    const values = editingValues.get(rowId)
    if (values && dataIndex in values) {
      return values[dataIndex]
    }
    return undefined
  }

  // 更新编辑值
  function updateEditingValue(rowId: string | number, dataIndex: string, value: unknown): void {
    const values = editingValues.get(rowId)
    if (values) {
      values[dataIndex] = value
    }
  }

  // ---- Cell 模式 ----

  function startCellEdit(
    rowId: string | number,
    dataIndex: string,
    record: Record<string, unknown>
  ): void {
    // 如果正在编辑同一个单元格，不做处理
    if (
      editingCell.value &&
      editingCell.value.rowId === rowId &&
      editingCell.value.dataIndex === dataIndex
    ) {
      return
    }

    // 保存当前正在编辑的单元格
    if (editingCell.value) {
      doSaveCellEditSync()
    }

    // 缓存原始值和编辑值
    originalValues.set(rowId, { [dataIndex]: record[dataIndex] })
    editingValues.set(rowId, { [dataIndex]: record[dataIndex] })

    editingCell.value = { rowId, dataIndex }
  }

  // 同步保存 (用于切换编辑单元格时)
  function doSaveCellEditSync(): void {
    if (!editingCell.value) return
    const { rowId, dataIndex } = editingCell.value
    const values = editingValues.get(rowId)
    const newValue = values?.[dataIndex]
    const original = originalValues.get(rowId)?.[dataIndex]

    if (newValue !== original) {
      updateDataSourceField(rowId, dataIndex, newValue)
    }

    editingCell.value = null
    editingValues.delete(rowId)
    originalValues.delete(rowId)
  }

  async function saveCellEdit(): Promise<void> {
    if (!editingCell.value) return

    const { rowId, dataIndex } = editingCell.value
    const values = editingValues.get(rowId)
    const newValue = values?.[dataIndex]
    const original = originalValues.get(rowId)?.[dataIndex]
    const record = getRecordByKey(rowId)

    // 值没变，直接退出编辑
    if (newValue === original) {
      editingCell.value = null
      editingValues.delete(rowId)
      originalValues.delete(rowId)
      return
    }

    if (onSave) {
      try {
        const success = await onSave({
          rowId,
          dataIndex,
          value: newValue,
          record,
        })

        if (success) {
          updateDataSourceField(rowId, dataIndex, newValue)
        }
      } catch {
        ElMessage.error('保存失败')
      }
    } else {
      // 没有 onSave 回调，直接乐观更新
      updateDataSourceField(rowId, dataIndex, newValue)
    }

    editingCell.value = null
    editingValues.delete(rowId)
    originalValues.delete(rowId)
  }

  function cancelCellEdit(): void {
    if (!editingCell.value) return

    const rowId = editingCell.value.rowId
    editingCell.value = null
    editingValues.delete(rowId)
    originalValues.delete(rowId)
  }

  // ---- Row 模式 ----

  function startRowEdit(rowId: string | number, record: Record<string, unknown>): void {
    // 深拷贝整行原始值
    const cloned: Record<string, unknown> = {}
    Object.keys(record).forEach((key) => {
      cloned[key] = record[key]
    })
    originalValues.set(rowId, cloned)
    editingValues.set(rowId, { ...cloned })

    editingRowKeys.add(rowId)
  }

  async function saveRowEdit(rowId: string | number): Promise<void> {
    const values = editingValues.get(rowId)
    const original = originalValues.get(rowId)

    if (!values || !original) {
      editingRowKeys.delete(rowId)
      editingValues.delete(rowId)
      originalValues.delete(rowId)
      return
    }

    // 计算变更字段
    const changedValues: Record<string, unknown> = {}
    let hasChanged = false
    Object.keys(values).forEach((key) => {
      if (values[key] !== original[key]) {
        changedValues[key] = values[key]
        hasChanged = true
      }
    })

    if (!hasChanged) {
      editingRowKeys.delete(rowId)
      editingValues.delete(rowId)
      originalValues.delete(rowId)
      return
    }

    if (onSave) {
      try {
        const success = await onSave({
          rowId,
          values: changedValues,
          record: original,
        })

        if (success) {
          updateDataSourceRecord(rowId, changedValues)
        }
      } catch {
        ElMessage.error('保存失败')
      }
    } else {
      updateDataSourceRecord(rowId, changedValues)
    }

    editingRowKeys.delete(rowId)
    editingValues.delete(rowId)
    originalValues.delete(rowId)
  }

  function cancelRowEdit(rowId: string | number): void {
    editingRowKeys.delete(rowId)
    editingValues.delete(rowId)
    originalValues.delete(rowId)
  }

  // ---- Batch 模式 ----

  function startBatchEdit(
    rowIds: Array<string | number>,
    records: Array<Record<string, unknown>>
  ): void {
    for (let i = 0; i < rowIds.length; i++) {
      const rowId = rowIds[i]
      const record = records[i]

      // 跳过已在编辑中的行，避免覆盖缓存
      if (editingRowKeys.has(rowId)) continue

      const cloned: Record<string, unknown> = {}
      Object.keys(record).forEach((key) => {
        cloned[key] = record[key]
      })
      originalValues.set(rowId, cloned)
      editingValues.set(rowId, { ...cloned })
      editingRowKeys.add(rowId)
    }
  }

  async function saveBatchEdit(): Promise<void> {
    const batchRows: Array<{
      rowId: string | number
      record: Record<string, unknown>
      values: Record<string, unknown>
    }> = []

    editingRowKeys.forEach((rowId) => {
      const values = editingValues.get(rowId)
      const original = originalValues.get(rowId)
      if (!values || !original) return

      const changedValues: Record<string, unknown> = {}
      let hasChanged = false
      Object.keys(values).forEach((key) => {
        if (values[key] !== original[key]) {
          changedValues[key] = values[key]
          hasChanged = true
        }
      })

      if (hasChanged) {
        batchRows.push({ rowId, record: { ...original }, values: changedValues })
      }
    })

    // 无变更，直接退出编辑态
    if (batchRows.length === 0) {
      const rowIds = [...editingRowKeys]
      rowIds.forEach((rowId) => {
        editingRowKeys.delete(rowId)
        editingValues.delete(rowId)
        originalValues.delete(rowId)
      })
      return
    }

    if (onBatchSave) {
      try {
        const success = await onBatchSave({
          batch: true,
          rows: batchRows,
          record: {},
          rowId: '',
        })
        if (success) {
          for (const { rowId, values } of batchRows) {
            updateDataSourceRecord(rowId, values)
          }
        }
      } catch {
        ElMessage.error('批量保存失败')
      }
    } else if (onSave) {
      // 回退方案：逐行调用 onSave
      for (const { rowId, record, values } of batchRows) {
        try {
          const success = await onSave({ rowId, values, record })
          if (success) {
            updateDataSourceRecord(rowId, values)
          }
        } catch {
          ElMessage.error(`行 ${rowId} 保存失败`)
        }
      }
    } else {
      // 无回调，乐观更新
      for (const { rowId, values } of batchRows) {
        updateDataSourceRecord(rowId, values)
      }
    }

    // 清理所有编辑状态
    const rowIdsToClean = [...editingRowKeys]
    rowIdsToClean.forEach((rowId) => {
      editingRowKeys.delete(rowId)
      editingValues.delete(rowId)
      originalValues.delete(rowId)
    })
  }

  function cancelBatchEdit(): void {
    const rowIds = [...editingRowKeys]
    rowIds.forEach((rowId) => {
      editingRowKeys.delete(rowId)
      editingValues.delete(rowId)
      originalValues.delete(rowId)
    })
  }

  // 构造 provide 上下文
  const editableContext: EditableContext = {
    get editMode() {
      return editMode.value
    },
    isEditing,
    getEditingValue,
    updateEditingValue,
    startCellEdit,
    saveCellEdit,
    cancelCellEdit,
    startRowEdit,
    saveRowEdit,
    cancelRowEdit,
    startBatchEdit,
    saveBatchEdit,
    cancelBatchEdit,
  }

  return {
    editingCell,
    editingRowKeys,
    isEditing,
    getEditingValue,
    updateEditingValue,
    startCellEdit,
    saveCellEdit,
    cancelCellEdit,
    startRowEdit,
    saveRowEdit,
    cancelRowEdit,
    startBatchEdit,
    saveBatchEdit,
    cancelBatchEdit,
    editableContext,
  }
}
