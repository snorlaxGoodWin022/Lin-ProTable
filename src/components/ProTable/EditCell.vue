<template>
  <div class="edit-cell" @click.stop>
    <!-- 输入框 -->
    <el-input
      v-if="editType === 'input'"
      ref="inputRef"
      v-model="currentValue"
      :placeholder="placeholder"
      size="small"
      v-bind="editProps"
      @keyup.enter="handleSave"
      @keyup.escape="handleCancel"
      @blur="handleBlur"
    />

    <!-- 文本域 -->
    <el-input
      v-else-if="editType === 'textarea'"
      ref="inputRef"
      v-model="currentValue"
      type="textarea"
      :placeholder="placeholder"
      size="small"
      :rows="2"
      v-bind="editProps"
      @keyup.escape="handleCancel"
    />

    <!-- 数字输入 -->
    <el-input-number
      v-else-if="editType === 'number'"
      ref="inputRef"
      v-model="currentValue"
      :placeholder="placeholder"
      size="small"
      controls-position="right"
      v-bind="editProps"
      @keyup.enter="handleSave"
      @keyup.escape="handleCancel"
      @blur="handleBlur"
    />

    <!-- 下拉选择 -->
    <el-select
      v-else-if="editType === 'select'"
      ref="inputRef"
      v-model="currentValue"
      :placeholder="placeholder"
      size="small"
      v-bind="editProps"
      @change="handleSave"
      @keyup.escape="handleCancel"
      @blur="handleBlur"
    >
      <el-option v-for="opt in options" :key="opt.value" :label="opt.label" :value="opt.value" />
    </el-select>

    <!-- 日期选择 -->
    <el-date-picker
      v-else-if="editType === 'date'"
      ref="inputRef"
      v-model="currentValue"
      type="date"
      :placeholder="placeholder"
      size="small"
      value-format="YYYY-MM-DD"
      style="width: 100%"
      v-bind="editProps"
      @change="handleSave"
      @keyup.escape="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, inject } from 'vue'
import type { ColumnProps, EditableContext } from './types'

interface Props {
  column: ColumnProps
  value: unknown
  rowId: string | number
  mode: 'cell' | 'row'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'save', rowId: string | number, dataIndex: string, value: unknown): void
  (e: 'cancel'): void
}>()

const editableContext = inject<EditableContext>('editableContext')

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Element Plus 组件 ref 需要灵活类型
const inputRef = ref<any>(null)

// 解析编辑配置
const editConfig = computed(() => {
  const { editable } = props.column
  if (typeof editable === 'object') {
    return editable
  }
  return {}
})

const editType = computed(() => editConfig.value.type || 'input')
const editProps = computed(() => editConfig.value.props || {})
const options = computed(() => editConfig.value.options || [])
const placeholder = computed(() => {
  return editConfig.value.placeholder || `请输入${props.column.title}`
})

// 当前编辑值
const currentValue = ref(props.value)

// 自动聚焦
onMounted(() => {
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus?.()
    }
  })
})

// 保存
function handleSave() {
  if (props.mode === 'cell') {
    editableContext?.updateEditingValue(props.rowId, props.column.dataIndex, currentValue.value)
    editableContext?.saveCellEdit()
  } else {
    editableContext?.updateEditingValue(props.rowId, props.column.dataIndex, currentValue.value)
  }
  emit('save', props.rowId, props.column.dataIndex, currentValue.value)
}

// 取消
function handleCancel() {
  if (props.mode === 'cell') {
    editableContext?.cancelCellEdit()
  }
  emit('cancel')
}

// blur 处理 (cell 模式自动保存)
function handleBlur() {
  if (props.mode === 'cell') {
    // 延迟保存，避免点击其他操作时立即触发
    setTimeout(() => {
      if (editableContext?.isEditing(props.rowId, props.column.dataIndex)) {
        editableContext.updateEditingValue(props.rowId, props.column.dataIndex, currentValue.value)
        editableContext.saveCellEdit()
      }
    }, 150)
  }
}
</script>

<style scoped>
.edit-cell {
  width: 100%;
}

.edit-cell :deep(.el-input),
.edit-cell :deep(.el-select),
.edit-cell :deep(.el-date-editor) {
  width: 100%;
}

.edit-cell :deep(.el-input-number) {
  width: 100%;
}
</style>
