import { ref, computed, type Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ColumnProps, CrudConfig } from '../types'

interface UseCrudConfig {
  crud: CrudConfig
  columns: ColumnProps[]
  rowKey: string | ((record: Record<string, unknown>) => string)
  refresh: () => void
  selectedRowKeys: Ref<(string | number)[]>
  clearSelection: () => void
}

export function useCrud(config: UseCrudConfig) {
  const { crud, columns, rowKey, refresh, selectedRowKeys, clearSelection } = config

  const drawerVisible = ref(false)
  const crudMode = ref<'create' | 'update'>('create')
  const formData = ref<Record<string, unknown>>({})
  const formLoading = ref(false)
  const deleteLoading = ref(false)
  const currentRecord = ref<Record<string, unknown> | null>(null)

  // 获取表单用列配置
  const formColumns = computed<ColumnProps[]>(() => {
    if (crud.formColumns) return crud.formColumns

    return columns.filter((col) => {
      if (col.hideInForm) return false
      if (col.dataIndex === 'action') return false
      if (col.customRender && !col.formType) return false
      return true
    })
  })

  // 获取列的表单控件类型
  function getFormType(col: ColumnProps): string {
    if (col.formType) return col.formType
    const editable = col.editable
    if (typeof editable === 'object' && editable.type) return editable.type
    if (col.valueType === 'dateTime') return 'datetime'
    if (col.valueType === 'digit') return 'number'
    if (col.valueType === 'money' || col.valueType === 'percent') return 'input'
    if (col.valueType === 'enum' || col.valueType === 'select') return 'select'
    if (col.valueType === 'date') return 'date'
    if (col.valueType === 'text' || !col.valueType) return 'input'
    return 'input'
  }

  // 打开新增
  function openCreate() {
    crudMode.value = 'create'
    currentRecord.value = null
    const data: Record<string, unknown> = {}
    formColumns.value.forEach((col) => {
      data[col.dataIndex] = col.defaultValue !== undefined ? col.defaultValue : undefined
    })
    formData.value = data
    drawerVisible.value = true
  }

  // 打开编辑
  function openUpdate(record: Record<string, unknown>) {
    crudMode.value = 'update'
    currentRecord.value = { ...record }
    formData.value = { ...record }
    drawerVisible.value = true
  }

  // 提交表单
  async function handleSubmit() {
    formLoading.value = true
    try {
      let success: boolean
      if (crudMode.value === 'create') {
        if (!crud.create) return
        success = await crud.create(formData.value)
      } else {
        if (!crud.update) return
        success = await crud.update(formData.value)
      }

      if (success !== false) {
        ElMessage.success(crudMode.value === 'create' ? '新增成功' : '编辑成功')
        drawerVisible.value = false
        refresh()
      } else {
        ElMessage.error(crudMode.value === 'create' ? '新增失败' : '编辑失败')
      }
    } catch {
      ElMessage.error(crudMode.value === 'create' ? '新增失败' : '编辑失败')
    } finally {
      formLoading.value = false
    }
  }

  // 单行删除
  async function handleDelete(rowId: string | number) {
    if (!crud.delete) return

    try {
      await ElMessageBox.confirm('确定要删除该条数据吗？', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return
    }

    deleteLoading.value = true
    try {
      const success = await crud.delete(rowId)
      if (success !== false) {
        ElMessage.success('删除成功')
        refresh()
      } else {
        ElMessage.error('删除失败')
      }
    } catch {
      ElMessage.error('删除失败')
    } finally {
      deleteLoading.value = false
    }
  }

  // 批量删除
  async function handleBatchDelete() {
    if (!crud.batchDelete) return
    if (selectedRowKeys.value.length === 0) {
      ElMessage.warning('请先选择要删除的数据')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedRowKeys.value.length} 条数据吗？`,
        '批量删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
    } catch {
      return
    }

    deleteLoading.value = true
    try {
      const success = await crud.batchDelete([...selectedRowKeys.value])
      if (success !== false) {
        ElMessage.success(`成功删除 ${selectedRowKeys.value.length} 条数据`)
        clearSelection()
        refresh()
      } else {
        ElMessage.error('批量删除失败')
      }
    } catch {
      ElMessage.error('批量删除失败')
    } finally {
      deleteLoading.value = false
    }
  }

  // 关闭抽屉
  function closeDrawer() {
    drawerVisible.value = false
  }

  return {
    drawerVisible,
    crudMode,
    formData,
    formLoading,
    deleteLoading,
    formColumns,
    getFormType,
    openCreate,
    openUpdate,
    handleSubmit,
    handleDelete,
    handleBatchDelete,
    closeDrawer,
  }
}
