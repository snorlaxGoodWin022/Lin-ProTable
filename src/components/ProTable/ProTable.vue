<template>
  <div class="pro-table">
    <!-- 工具栏 -->
    <ProTableToolbar
      v-if="showToolbar"
      :loading="loading"
      :columns="columns"
      :column-state="columnState"
      @refresh="refresh"
      @export="handleExport"
      @update:column-state="updateColumnState"
    >
      <!-- 透传工具栏插槽 -->
      <template #toolbar-left>
        <!-- batch 模式按钮组 -->
        <template v-if="editMode === 'batch'">
          <el-space>
            <el-button
              v-if="!isBatchEditing"
              type="primary"
              :disabled="selectedRowKeys.length === 0"
              @click="handleBatchStartEdit"
            >
              批量编辑 ({{ selectedRowKeys.length }})
            </el-button>
            <template v-else>
              <el-button type="success" @click="handleBatchSave">批量保存</el-button>
              <el-button @click="handleBatchCancel">取消</el-button>
            </template>
          </el-space>
        </template>
        <slot name="toolbar-left" />
      </template>
      <template #toolbar-right>
        <slot name="toolbar-right" />
      </template>
    </ProTableToolbar>

    <!-- 虚拟滚动表格或普通表格 -->
    <template v-if="virtualScroll.enabled">
      <ProVirtualTable
        :columns="processedColumns"
        :data="dataSource"
        :loading="loading"
        :row-key="rowKey"
        :estimated-row-height="virtualScroll.estimatedRowHeight"
        :row-selection="selectionConfig"
        :selected-row-keys="selectedRowKeys"
        :is-all-selected="isAllSelected"
        :is-indeterminate="isIndeterminate"
        @row-click="handleRowClick"
        @select="handleVirtualSelect"
        @select-all="toggleAll"
      >
        <!-- 透传所有表格插槽 -->
        <template v-for="(_, name) in $slots" #[name]="slotData">
          <slot :name="name" v-bind="slotData || {}" />
        </template>
      </ProVirtualTable>
    </template>
    <template v-else>
      <el-table
        ref="elTableRef"
        v-bind="$attrs"
        :data="dataSource"
        :row-key="rowKey"
        :loading="loading"
        :row-class-name="getRowClassName"
        @sort-change="handleSortChange"
        @filter-change="handleFilterChange"
        @selection-change="handleSelectionChange"
      >
        <!-- checkbox 多选列 -->
        <el-table-column
          v-if="selectionConfig && selectionConfig.type === 'checkbox'"
          type="selection"
          :width="selectionConfig.columnWidth || 48"
          :fixed="selectionConfig.fixed !== false ? 'left' : false"
          :selectable="selectionConfig.getCheckboxProps ? selectableFn : undefined"
        />

        <!-- radio 单选列 -->
        <el-table-column
          v-if="selectionConfig && selectionConfig.type === 'radio'"
          :width="selectionConfig.columnWidth || 48"
          :fixed="selectionConfig.fixed !== false ? 'left' : false"
        >
          <template #default="scope">
            <el-radio
              :model-value="isSelected(scope.row)"
              :value="true"
              :disabled="getRowDisabled(scope.row)"
              @change="handleRadioSelect(scope.row)"
            >
              &nbsp;
            </el-radio>
          </template>
        </el-table-column>

        <template v-for="column in processedColumns" :key="column.dataIndex">
          <!-- 行编辑模式下的操作列 -->
          <el-table-column
            v-if="isEditModeColumn(column)"
            :prop="column.dataIndex"
            :label="column.title"
            :width="column.width"
            :fixed="column.fixed"
          >
            <template #default="scope">
              <template v-if="editingRowKeys.has(getRowKeyValue(scope.row))">
                <!-- row 模式：显示保存/取消 -->
                <template v-if="editMode === 'row'">
                  <el-space>
                    <el-button size="small" type="primary" @click="handleRowSave(scope.row)"
                      >保存</el-button
                    >
                    <el-button size="small" @click="handleRowCancel(scope.row)">取消</el-button>
                  </el-space>
                </template>
                <!-- batch 模式：编辑中提示 -->
                <template v-else>
                  <span style="color: #e6a23c; font-size: 12px">编辑中...</span>
                </template>
              </template>
              <template v-else>
                <slot
                  v-if="$slots[column.dataIndex]"
                  :name="column.dataIndex"
                  :row="scope.row"
                  :index="scope.$index"
                  :value="scope.row[column.dataIndex]"
                />
                <el-space v-else>
                  <el-button
                    v-if="editMode === 'row'"
                    size="small"
                    type="primary"
                    @click="handleRowEdit(scope.row)"
                    >编辑</el-button
                  >
                  <slot name="action-extra" :row="scope.row" :index="scope.$index" />
                </el-space>
              </template>
            </template>
          </el-table-column>

          <!-- 普通列 / 编辑列 -->
          <el-table-column
            v-else
            :prop="column.dataIndex"
            :label="column.title"
            :width="column.width"
            :fixed="column.fixed"
            :sortable="column.sorter ? 'custom' : false"
            :column-key="column.dataIndex"
            :filters="column.filters"
            :filtered-value="tableState.filters[column.dataIndex] || []"
            filter-confirm-text="确定"
            filter-reset-text="取消"
          >
            <!-- 自定义列渲染 -->
            <template #default="scope">
              <!-- 编辑态 -->
              <template v-if="isCellEditing(scope.row, column)">
                <EditCell
                  :column="column"
                  :value="getCellValue(scope.row, column)"
                  :row-id="getRowKeyValue(scope.row)"
                  :mode="editMode === 'cell' ? 'cell' : 'row'"
                />
              </template>
              <!-- cell 模式：可点击进入编辑 -->
              <template v-else-if="editMode === 'cell' && column.editable">
                <div class="cell-editable" @click="handleCellClick(scope.row, column)">
                  <slot
                    v-if="$slots[column.dataIndex]"
                    :name="column.dataIndex"
                    :row="scope.row"
                    :index="scope.$index"
                    :value="scope.row[column.dataIndex]"
                  />
                  <ColumnRenderer
                    v-else
                    :column="column"
                    :value="scope.row[column.dataIndex]"
                    :record="scope.row"
                    :index="scope.$index"
                  />
                  <el-icon class="cell-edit-icon"><Edit /></el-icon>
                </div>
              </template>
              <!-- 具名插槽 -->
              <slot
                v-else-if="$slots[column.dataIndex]"
                :name="column.dataIndex"
                :row="scope.row"
                :index="scope.$index"
                :value="scope.row[column.dataIndex]"
              />
              <!-- 默认渲染 -->
              <template v-else>
                <ColumnRenderer
                  :column="column"
                  :value="scope.row[column.dataIndex]"
                  :record="scope.row"
                  :index="scope.$index"
                />
              </template>
            </template>
          </el-table-column>
        </template>
      </el-table>
    </template>

    <!-- 分页 -->
    <div v-if="pagination.enabled" class="pro-table-pagination">
      <el-pagination
        v-model:current-page="tableState.current"
        v-model:page-size="tableState.pageSize"
        :total="total"
        :page-sizes="pagination.pageSizes"
        :layout="pagination.layout"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide, toRef, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import ProTableToolbar from './Toolbar.vue'
import ProVirtualTable from './VirtualTable.vue'
import ColumnRenderer from './ColumnRenderer.vue'
import EditCell from './EditCell.vue'
import { exportToExcel } from './utils/export'
import { useTableState } from './hooks/useTableState'
import { useColumnState } from './hooks/useColumnState'
import { useUrlSync } from './hooks/useUrlSync'
import { useEditable } from './hooks/useEditable'
import { useRowSelection } from './hooks/useRowSelection'
import type { ColumnProps, ProTableProps, TableState } from './types'

const props = withDefaults(defineProps<ProTableProps>(), {
  rowKey: 'id',
  showToolbar: true,
  pagination: () => ({
    enabled: true,
    pageSizes: [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next, jumper',
  }),
  virtualScroll: () => ({ enabled: false, estimatedRowHeight: 55 }),
  syncUrl: true,
  editMode: undefined,
})

const emit = defineEmits<{
  (e: 'change', state: TableState): void
  (e: 'row-click', row: Record<string, unknown>, event: Event): void
  (e: 'update:params', params: Record<string, unknown>): void
  (e: 'save', params: Record<string, unknown>): void
  (
    e: 'selection-change',
    selectedRowKeys: (string | number)[],
    selectedRows: Record<string, unknown>[]
  ): void
}>()

// 状态管理
const { tableState, setTableState, resetTableState } = useTableState()
const { columnState, processedColumns, updateColumnState } = useColumnState(props.columns)

// URL 同步
if (props.syncUrl) {
  const { initFromUrl } = useUrlSync(tableState, () => fetchData())
  initFromUrl()
}

// 表格数据
const dataSource = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const total = ref(0)

// ---- 编辑功能 ----
const editModeRef = toRef(props, 'editMode')

// 获取行 key 值
function getRowKeyValue(row: Record<string, unknown>): string | number {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey]
}

// 根据 rowKey 查找记录
function getRecordByKey(rowId: string | number): Record<string, unknown> | undefined {
  return dataSource.value.find((row) => {
    const key = getRowKeyValue(row)
    return String(key) === String(rowId)
  })
}

const {
  editingRowKeys,
  isEditing,
  getEditingValue,

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
} = useEditable({
  editMode: editModeRef,
  onSave: props.onSave,
  onBatchSave: props.onBatchSave,
  getRecordByKey,
  dataSource,
  rowKey: props.rowKey,
})

// provide 编辑上下文给子组件
provide('editableContext', editableContext)

// ---- 行选择功能 ----
const rowSelectionRef = toRef(props, 'rowSelection')

const {
  selectedRowKeys,
  selectedRows,
  isAllSelected,
  isIndeterminate,
  isSelected,
  getRowDisabled,
  selectionConfig,
  toggleRow,
  toggleAll,
  clearSelection,
  syncFromPageSelection,
  selectRows: selectRowsInternal,
} = useRowSelection({
  rowSelection: rowSelectionRef,
  rowKey: props.rowKey,
  dataSource,
})

// 判断单元格是否处于编辑态
function isCellEditing(row: Record<string, unknown>, column: ColumnProps): boolean {
  if (!props.editMode || !column.editable) return false
  const rowId = getRowKeyValue(row)
  return isEditing(rowId, column.dataIndex)
}

// 获取单元格当前值（编辑中取编辑值，否则取原始值）
function getCellValue(row: Record<string, unknown>, column: ColumnProps): unknown {
  const rowId = getRowKeyValue(row)
  const editValue = getEditingValue(rowId, column.dataIndex)
  return editValue !== undefined ? editValue : row[column.dataIndex]
}

// 判断是否是编辑模式下的操作列
function isEditModeColumn(column: ColumnProps): boolean {
  return (props.editMode === 'row' || props.editMode === 'batch') && column.dataIndex === 'action'
}

// 行编辑：点击编辑
function handleRowEdit(row: Record<string, unknown>) {
  const rowId = getRowKeyValue(row)
  startRowEdit(rowId, row)
}

// 行编辑：保存
async function handleRowSave(row: Record<string, unknown>) {
  const rowId = getRowKeyValue(row)
  await saveRowEdit(rowId)
  emit('save', { rowId, record: row })
}

// 行编辑：取消
function handleRowCancel(row: Record<string, unknown>) {
  const rowId = getRowKeyValue(row)
  cancelRowEdit(rowId)
}

// cell 模式下，点击单元格进入编辑
function handleCellClick(row: Record<string, unknown>, column: ColumnProps) {
  if (props.editMode !== 'cell' || !column.editable) return
  const rowId = getRowKeyValue(row)
  startCellEdit(rowId, column.dataIndex, row)
}

// ---- Batch 编辑 ----

// 是否处于 batch 编辑状态
const isBatchEditing = computed(() => {
  return props.editMode === 'batch' && editingRowKeys.size > 0
})

// 开始批量编辑
function handleBatchStartEdit() {
  if (selectedRowKeys.value.length === 0) {
    ElMessage.warning('请先选择要编辑的行')
    return
  }
  const records = selectedRowKeys.value
    .map((key) => getRecordByKey(key))
    .filter((r): r is Record<string, unknown> => r !== undefined)
  startBatchEdit(selectedRowKeys.value, records)
}

// 批量保存
async function handleBatchSave() {
  await saveBatchEdit()
}

// 批量取消
function handleBatchCancel() {
  cancelBatchEdit()
}

// 分页配置
const pagination = computed(() => {
  if (props.pagination === false) {
    return { enabled: false }
  }
  return {
    enabled: true,
    pageSizes: [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next, jumper',
    ...(typeof props.pagination === 'object' ? props.pagination : {}),
  }
})

// 虚拟滚动配置
const virtualScroll = computed(() => {
  if (props.virtualScroll === false) {
    return { enabled: false, estimatedRowHeight: 55 }
  }
  return {
    enabled: false,
    estimatedRowHeight: 55,
    ...(typeof props.virtualScroll === 'object' ? props.virtualScroll : {}),
  }
})

// 请求数据
async function fetchData() {
  if (!props.request) return

  loading.value = true
  try {
    const requestParams = {
      current: tableState.current,
      pageSize: tableState.pageSize,
      ...tableState.filters,
      ...props.params,
    }

    // 添加排序参数
    if (tableState.sorter) {
      requestParams.sortField = tableState.sorter.field
      requestParams.sortOrder = tableState.sorter.order
    }

    const result = await props.request(requestParams)

    if (result.success !== false) {
      dataSource.value = result.data || []
      total.value = result.total || 0
    } else {
      ElMessage.error(result.message || '请求失败')
    }
  } catch (error) {
    console.error('请求数据失败', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 表格事件处理
function handleSortChange({
  prop,
  order,
}: {
  prop: string
  order: 'ascending' | 'descending' | null
}) {
  if (order) {
    setTableState({
      sorter: {
        field: prop,
        order: order === 'ascending' ? 'ascend' : 'descend',
      },
      current: 1,
    })
  } else {
    setTableState({ sorter: null })
  }
  fetchData()
}

function handleFilterChange(filters: Record<string, unknown[]>) {
  const activeFilters: Record<string, unknown[]> = {}
  Object.keys(filters).forEach((key) => {
    if (filters[key] && filters[key].length > 0) {
      activeFilters[key] = filters[key]
    }
  })

  setTableState({
    filters: activeFilters,
    current: 1,
  })
  fetchData()
}

function handlePageChange(current: number) {
  setTableState({ current })
  fetchData()
}

function handlePageSizeChange(pageSize: number) {
  setTableState({ pageSize, current: 1 })
  fetchData()
}

function handleRowClick(row: Record<string, unknown>, event: Event) {
  emit('row-click', row, event)
}

// ---- 行选择事件 ----

// el-table 引用（用于手动恢复选中状态）
const elTableRef = ref()

// 翻页后恢复 checkbox 选中状态
watch(dataSource, () => {
  if (!selectionConfig.value || selectionConfig.value.type !== 'checkbox') return
  nextTick(() => {
    if (!elTableRef.value) return
    for (const row of dataSource.value) {
      if (isSelected(row)) {
        elTableRef.value.toggleRowSelection(row, true)
      }
    }
  })
})

// 行样式：禁用行添加灰底
function getRowClassName({ row }: { row: Record<string, unknown> }): string {
  if (selectionConfig.value && getRowDisabled(row)) {
    return 'pro-table-row--disabled'
  }
  return ''
}

// el-table checkbox selection-change 回调
function handleSelectionChange(selection: Record<string, unknown>[]) {
  if (!selectionConfig.value || selectionConfig.value.type !== 'checkbox') return

  syncFromPageSelection(selection, dataSource.value)
  emit('selection-change', [...selectedRowKeys.value], [...selectedRows.value])
}

// radio 单选
function handleRadioSelect(row: Record<string, unknown>) {
  toggleRow(row)
  emit('selection-change', [...selectedRowKeys.value], [...selectedRows.value])
}

// 虚拟表格单行选择
function handleVirtualSelect(row: Record<string, unknown>) {
  toggleRow(row)
  emit('selection-change', [...selectedRowKeys.value], [...selectedRows.value])
}

// el-table selectable 回调（控制行是否可选）
function selectableFn(row: Record<string, unknown>): boolean {
  return !getRowDisabled(row)
}

// 刷新
function refresh() {
  fetchData()
}

// 导出
function handleExport() {
  exportToExcel(processedColumns.value, dataSource.value, '表格数据.xlsx')
  ElMessage.success('导出成功')
}

// 暴露方法给父组件
defineExpose({
  refresh,
  fetchData,
  getTableData: () => dataSource.value,
  getTableState: () => tableState,
  resetTableState,
  startCellEdit,
  saveCellEdit,
  cancelCellEdit,
  startRowEdit,
  saveRowEdit,
  cancelRowEdit,
  startBatchEdit,
  saveBatchEdit,
  cancelBatchEdit,
  getSelectedRowKeys: () => selectedRowKeys.value,
  getSelectedRows: () => selectedRows.value,
  clearSelection,
  selectRows: selectRowsInternal,
})

// 初始加载
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.pro-table {
  width: 100%;
}

.pro-table-pagination {
  margin-top: 16px;
  text-align: right;
}

.cell-editable {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.cell-editable:hover {
  background-color: var(--el-fill-color-light);
}

.cell-edit-icon {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  opacity: 0;
  transition: opacity 0.2s;
}

.cell-editable:hover .cell-edit-icon {
  opacity: 1;
}
</style>

<style>
/* 禁用行样式不能 scoped，因为 el-table 行类名在子组件内 */
.pro-table-row--disabled {
  opacity: 0.5;
  background-color: var(--el-fill-color-lighter) !important;
}
</style>
