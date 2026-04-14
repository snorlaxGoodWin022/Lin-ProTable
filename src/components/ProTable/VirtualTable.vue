<template>
  <div class="virtual-table-container">
    <div
      ref="tableContainer"
      class="virtual-table-wrapper"
      :style="{ height: containerHeight + 'px' }"
      @scroll="handleScroll"
    >
      <div class="virtual-table-content" :style="{ height: totalHeight + 'px' }">
        <table class="virtual-table" :style="{ transform: `translateY(${translateY}px)` }">
          <thead>
            <tr>
              <!-- 选择列表头 -->
              <th
                v-if="rowSelection && rowSelection.type === 'checkbox'"
                :style="{
                  width: (rowSelection.columnWidth || 48) + 'px',
                  minWidth: (rowSelection.columnWidth || 48) + 'px',
                }"
                class="virtual-table-header selection-header"
              >
                <div class="header-content" style="justify-content: center">
                  <el-checkbox
                    :model-value="isAllSelected"
                    :indeterminate="isIndeterminate"
                    @change="$emit('select-all')"
                  />
                </div>
              </th>
              <th
                v-if="rowSelection && rowSelection.type === 'radio'"
                :style="{
                  width: (rowSelection.columnWidth || 48) + 'px',
                  minWidth: (rowSelection.columnWidth || 48) + 'px',
                }"
                class="virtual-table-header selection-header"
              >
                <div class="header-content" style="justify-content: center">&nbsp;</div>
              </th>
              <th
                v-for="column in columns"
                :key="column.dataIndex"
                :style="{ width: column.width + 'px', minWidth: column.width + 'px' }"
                class="virtual-table-header"
              >
                <div class="header-content">
                  {{ column.title }}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in visibleRows"
              :key="getRowKey(row)"
              :style="{ height: rowHeight + 'px' }"
              @click="$emit('row-click', row, $event)"
            >
              <!-- 选择列单元格 -->
              <td
                v-if="rowSelection"
                :style="{
                  width: (rowSelection.columnWidth || 48) + 'px',
                  minWidth: (rowSelection.columnWidth || 48) + 'px',
                }"
                class="virtual-table-cell selection-cell"
              >
                <div class="cell-content" style="justify-content: center">
                  <el-checkbox
                    v-if="rowSelection.type === 'checkbox'"
                    :model-value="selectedRowKeys.includes(getRowKey(row))"
                    :disabled="getRowDisabled(row)"
                    @change="$emit('select', row)"
                    @click.stop
                  />
                  <el-radio
                    v-if="rowSelection.type === 'radio'"
                    :model-value="selectedRowKeys.includes(getRowKey(row))"
                    :disabled="getRowDisabled(row)"
                    @change="$emit('select', row)"
                    @click.stop
                  >
                    &nbsp;
                  </el-radio>
                </div>
              </td>
              <td
                v-for="column in columns"
                :key="column.dataIndex"
                :style="{ width: column.width + 'px', minWidth: column.width + 'px' }"
                class="virtual-table-cell"
              >
                <div class="cell-content">
                  <!-- 编辑态 -->
                  <template v-if="editableContext && isCellEditing(row, column)">
                    <EditCell
                      :column="column"
                      :value="getCellValue(row, column)"
                      :row-id="getRowKey(row)"
                      mode="cell"
                    />
                  </template>
                  <!-- cell 模式可点击编辑 -->
                  <template
                    v-else-if="
                      editableContext && editableContext.editMode === 'cell' && column.editable
                    "
                  >
                    <div class="cell-editable" @click.stop="handleCellClick(row, column)">
                      <slot
                        v-if="$slots[column.dataIndex]"
                        :name="column.dataIndex"
                        :row="row"
                        :value="row[column.dataIndex]"
                      />
                      <ColumnRenderer
                        v-else
                        :column="column"
                        :value="row[column.dataIndex]"
                        :record="row"
                        :index="visibleRows.indexOf(row)"
                      />
                    </div>
                  </template>
                  <!-- 具名插槽 -->
                  <slot
                    v-else-if="$slots[column.dataIndex]"
                    :name="column.dataIndex"
                    :row="row"
                    :value="row[column.dataIndex]"
                  />
                  <!-- 默认渲染 -->
                  <template v-else>
                    <ColumnRenderer
                      :column="column"
                      :value="row[column.dataIndex]"
                      :record="row"
                      :index="visibleRows.indexOf(row)"
                    />
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 加载提示 -->
    <div v-if="loading" class="virtual-table-loading">
      <el-icon class="loading-icon"><Loading /></el-icon>
      加载中...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import ColumnRenderer from './ColumnRenderer.vue'
import EditCell from './EditCell.vue'
import type { ColumnProps, EditableContext, RowSelectionOptions } from './types'

interface Props {
  columns: ColumnProps[]
  data: Record<string, unknown>[]
  loading?: boolean
  rowKey?: string | ((record: Record<string, unknown>) => string)
  estimatedRowHeight?: number
  buffer?: number
  rowSelection?: RowSelectionOptions | null
  selectedRowKeys?: (string | number)[]
  isAllSelected?: boolean
  isIndeterminate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  rowKey: 'id',
  estimatedRowHeight: 55,
  buffer: 5,
  rowSelection: null,
  selectedRowKeys: () => [],
  isAllSelected: false,
  isIndeterminate: false,
})

defineEmits<{
  (e: 'row-click', row: Record<string, unknown>, event: Event): void
  (e: 'select', row: Record<string, unknown>): void
  (e: 'select-all'): void
}>()

// 注入编辑上下文
const editableContext = inject<EditableContext | null>('editableContext', null)

// 容器引用
const tableContainer = ref<HTMLDivElement>()

// 状态
const scrollTop = ref(0)
const containerHeight = ref(600)
const rowHeight = props.estimatedRowHeight
const buffer = props.buffer

// 计算可见行范围
const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / rowHeight)
  return Math.max(0, index - buffer)
})

const endIndex = computed(() => {
  const visibleRows = Math.ceil(containerHeight.value / rowHeight)
  const index = startIndex.value + visibleRows + buffer * 2
  return Math.min(props.data.length, index)
})

// 可见行数据
const visibleRows = computed(() => {
  return props.data.slice(startIndex.value, endIndex.value)
})

// 总高度
const totalHeight = computed(() => {
  return props.data.length * rowHeight
})

// Y轴偏移量
const translateY = computed(() => {
  return startIndex.value * rowHeight
})

// 获取行键值
function getRowKey(row: Record<string, unknown>): string {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey] || String(row)
}

// 判断单元格是否编辑态
function isCellEditing(row: Record<string, unknown>, column: ColumnProps): boolean {
  if (!editableContext || !column.editable) return false
  return editableContext.isEditing(getRowKey(row), column.dataIndex)
}

// 获取单元格当前值
function getCellValue(row: Record<string, unknown>, column: ColumnProps): unknown {
  if (!editableContext) return row[column.dataIndex]
  const editValue = editableContext.getEditingValue(getRowKey(row), column.dataIndex)
  return editValue !== undefined ? editValue : row[column.dataIndex]
}

// cell 模式点击
function handleCellClick(row: Record<string, unknown>, column: ColumnProps) {
  if (!editableContext) return
  editableContext.startCellEdit(getRowKey(row), column.dataIndex, row)
}

// 获取行禁用状态
function getRowDisabled(row: Record<string, unknown>): boolean {
  if (!props.rowSelection?.getCheckboxProps) return false
  return props.rowSelection.getCheckboxProps(row).disabled === true
}

// 处理滚动
function handleScroll(event: Event) {
  const target = event.target as HTMLDivElement
  scrollTop.value = target.scrollTop
}

// 更新容器高度
function updateContainerHeight() {
  if (tableContainer.value?.parentElement) {
    const parentHeight = tableContainer.value.parentElement.clientHeight
    containerHeight.value = Math.max(300, parentHeight - 100)
  }
}

// 监听窗口大小变化
function handleResize() {
  updateContainerHeight()
}

// 初始化
onMounted(() => {
  updateContainerHeight()
  window.addEventListener('resize', handleResize)
})

// 清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 监听数据变化，滚动到顶部
watch(
  () => props.data,
  () => {
    if (tableContainer.value) {
      tableContainer.value.scrollTop = 0
      scrollTop.value = 0
    }
  }
)
</script>

<style scoped>
.virtual-table-container {
  position: relative;
  width: 100%;
}

.virtual-table-wrapper {
  overflow-y: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  background: white;
}

.virtual-table-content {
  position: relative;
}

.virtual-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.virtual-table-header {
  position: sticky;
  top: 0;
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 12px 8px;
  text-align: left;
  font-weight: 500;
  color: var(--el-text-color-primary);
  z-index: 1;
}

.virtual-table-cell {
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 12px 8px;
  text-align: left;
  color: var(--el-text-color-regular);
}

.header-content,
.cell-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  height: 100%;
  display: flex;
  align-items: center;
}

.virtual-table-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

.cell-editable {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.cell-editable:hover {
  background-color: var(--el-fill-color-light);
}

.selection-header,
.selection-cell {
  text-align: center;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
