<template>
  <div class="column-setting">
    <div class="column-setting-header">
      <span>列设置</span>
      <el-link type="primary" @click="resetColumns">重置</el-link>
    </div>

    <div class="column-setting-body">
      <draggable v-model="localOrder" item-key="key" handle=".drag-handle" @end="handleDragEnd">
        <template #item="{ element }">
          <div class="column-item">
            <el-icon class="drag-handle"><Menu /></el-icon>
            <el-checkbox
              :key="element"
              :model-value="localVisible[element]"
              @update:model-value="(val) => handleVisibleChange(element, val)"
            >
              {{ getColumnTitle(element) }}
            </el-checkbox>
          </div>
        </template>
      </draggable>
    </div>

    <div class="column-setting-footer">
      <el-button size="small" @click="selectAll">全选</el-button>
      <el-button size="small" @click="unselectAll">全不选</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { Menu } from '@element-plus/icons-vue'
import type { ColumnProps, ColumnState } from './types'

interface Props {
  columns: ColumnProps[]
  columnState: ColumnState
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:column-state', state: ColumnState): void
}>()

defineExpose({
  applyChanges,
})

// 本地状态
const localOrder = ref([...props.columnState.order])
const localVisible = ref({ ...props.columnState.visible })

// 监听 props 变化，同步到本地状态
watch(
  () => props.columnState,
  (newState) => {
    console.log('watch props.columnState:', newState)
    localOrder.value = [...newState.order]
    localVisible.value = { ...newState.visible }
  },
  { deep: true }
)

// 获取列标题
function getColumnTitle(dataIndex: string) {
  const column = props.columns.find((col) => col.dataIndex === dataIndex)
  return column?.title || dataIndex
}

// 切换列显隐
function handleVisibleChange(dataIndex: string, visible: boolean) {
  console.log('handleVisibleChange:', dataIndex, visible, 'current:', localVisible.value[dataIndex])
  // 创建新对象以确保响应式更新
  localVisible.value = {
    ...localVisible.value,
    [dataIndex]: visible,
  }
  console.log('after update:', localVisible.value[dataIndex])
}

// 拖拽结束
function handleDragEnd() {
  // 状态已通过 watch 自动同步
}

// 重置列
function resetColumns() {
  localOrder.value = props.columns.map((col) => col.dataIndex)
  localVisible.value = props.columns.reduce(
    (acc, col) => {
      acc[col.dataIndex] = !col.hideInTable
      return acc
    },
    {} as Record<string, boolean>
  )
}

// 全选
function selectAll() {
  const newVisible = { ...localVisible.value }
  localOrder.value.forEach((dataIndex) => {
    newVisible[dataIndex] = true
  })
  localVisible.value = newVisible
}

// 全不选
function unselectAll() {
  const newVisible = { ...localVisible.value }
  localOrder.value.forEach((dataIndex) => {
    newVisible[dataIndex] = false
  })
  localVisible.value = newVisible
}

// 应用更改（点击确定时调用）
function applyChanges() {
  emit('update:column-state', {
    order: localOrder.value,
    visible: localVisible.value,
  })
}
</script>

<style scoped>
.column-setting {
  padding: 8px;
}

.column-setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 500;
}

.column-setting-body {
  max-height: 400px;
  overflow-y: auto;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.column-item:hover {
  background-color: var(--el-fill-color-light);
}

.drag-handle {
  cursor: move;
  color: var(--el-text-color-placeholder);
}

.column-setting-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
}
</style>
