<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-drawer
    :model-value="visible"
    :title="mode === 'create' ? '新增' : '编辑'"
    :width="width || 600"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      label-width="100px"
      label-position="right"
      class="crud-form"
    >
      <template v-for="column in columns" :key="column.dataIndex">
        <el-form-item :label="column.title" :prop="column.dataIndex" :rules="getRules(column)">
          <slot
            :name="`form-${column.dataIndex}`"
            :form-data="formData"
            :column="column"
            :mode="mode"
          >
            <el-input
              v-if="getFormType(column) === 'input'"
              v-model="formData[column.dataIndex]"
              :placeholder="column.formProps?.placeholder || `请输入${column.title}`"
              :disabled="isDisabled(column)"
              v-bind="column.formProps || {}"
            />

            <el-input
              v-else-if="getFormType(column) === 'textarea'"
              v-model="formData[column.dataIndex]"
              type="textarea"
              :rows="column.formProps?.rows || 3"
              :placeholder="column.formProps?.placeholder || `请输入${column.title}`"
              :disabled="isDisabled(column)"
              v-bind="column.formProps || {}"
            />

            <el-input-number
              v-else-if="getFormType(column) === 'number'"
              v-model="formData[column.dataIndex]"
              :placeholder="column.formProps?.placeholder || `请输入${column.title}`"
              :disabled="isDisabled(column)"
              v-bind="column.formProps || {}"
              style="width: 100%"
            />

            <el-select
              v-else-if="getFormType(column) === 'select'"
              v-model="formData[column.dataIndex]"
              :placeholder="column.formProps?.placeholder || `请选择${column.title}`"
              :disabled="isDisabled(column)"
              v-bind="column.formProps || {}"
              style="width: 100%"
            >
              <el-option
                v-for="opt in getSelectOptions(column)"
                :key="String(opt.value)"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>

            <el-date-picker
              v-else-if="getFormType(column) === 'datetime'"
              v-model="formData[column.dataIndex]"
              type="datetime"
              :placeholder="column.formProps?.placeholder || `请选择${column.title}`"
              :disabled="isDisabled(column)"
              v-bind="column.formProps || {}"
              style="width: 100%"
            />

            <el-date-picker
              v-else-if="getFormType(column) === 'date'"
              v-model="formData[column.dataIndex]"
              :placeholder="column.formProps?.placeholder || `请选择${column.title}`"
              :disabled="isDisabled(column)"
              v-bind="column.formProps || {}"
              style="width: 100%"
            />
          </slot>
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ColumnProps } from './types'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'update'
  columns: ColumnProps[]
  formData: Record<string, unknown>
  loading: boolean
  width?: string | number
  getFormType: (column: ColumnProps) => string
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit'): void
}>()

const formRef = ref()

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    emit('submit')
  } catch {
    // 校验失败
  }
}

function getRules(column: ColumnProps) {
  const formRules = column.formProps?.rules
  if (formRules) return formRules
  return column.rules || []
}

function isDisabled(column: ColumnProps): boolean {
  if (column.disabledInEdit && props.mode === 'update') return true
  return false
}

function getSelectOptions(column: ColumnProps): Array<{ label: string; value: unknown }> {
  if (column.formProps?.options)
    return column.formProps.options as Array<{ label: string; value: unknown }>

  const editable = column.editable
  if (typeof editable === 'object' && editable.options) return editable.options

  if (column.valueEnum) {
    return Object.entries(column.valueEnum).map(([value, item]) => ({
      label: item.text,
      value,
    }))
  }

  return []
}
</script>

<style scoped>
.crud-form {
  padding: 0 20px;
}
</style>
