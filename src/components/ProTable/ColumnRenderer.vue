<template>
  <div class="column-renderer">
    <template v-if="showCopyable">
      <el-tooltip content="点击复制">
        <span class="copyable-text" @click="handleCopy">
          {{ displayText }}
          <el-icon class="copy-icon"><DocumentCopy /></el-icon>
        </span>
      </el-tooltip>
    </template>
    <template v-else-if="isEllipsis">
      <el-tooltip :content="displayText" :disabled="!showTooltip">
        <span class="ellipsis-text">{{ displayText }}</span>
      </el-tooltip>
    </template>
    <template v-else>
      {{ displayText }}
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy } from '@element-plus/icons-vue'
import type { ColumnProps } from './types'

interface Props {
  column: ColumnProps
  value: any
  record: any
  index: number
}

const props = defineProps<Props>()

// 是否需要显示工具提示（文本超长时）
const showTooltip = computed(() => {
  if (!props.column.ellipsis) return false
  const text = String(getDisplayText())
  return text.length > 20 || text.includes('\n')
})

// 是否可复制
const showCopyable = computed(() => {
  return props.column.copyable && getDisplayText()
})

// 是否省略
const isEllipsis = computed(() => {
  return props.column.ellipsis
})

// 获取显示文本
const displayText = computed(() => {
  return getDisplayText()
})

// 格式化值
function formatValue(value: any): any {
  if (value == null || value === '') return ''

  const { column } = props

  // 自定义格式化函数优先
  if (column.formatter) {
    return column.formatter(value, props.record, props.index)
  }

  // 根据 valueType 格式化
  if (column.valueType) {
    switch (column.valueType) {
      case 'date':
        return new Date(value).toLocaleDateString('zh-CN')

      case 'dateTime':
        return new Date(value).toLocaleString('zh-CN')

      case 'money':
        return `¥${Number(value).toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`

      case 'percent':
        return `${(Number(value) * 100).toFixed(2)}%`

      case 'enum':
        if (column.valueEnum && column.valueEnum[value]) {
          const enumItem = column.valueEnum[value]
          if (enumItem.status) {
            return `<el-tag type="${enumItem.status}" size="small">${enumItem.text}</el-tag>`
          }
          return enumItem.text
        }
        return value

      case 'digit':
        return Number(value).toLocaleString('zh-CN')

      default:
        return value
    }
  }

  return value
}

// 获取显示文本（纯文本）
function getDisplayText(): string {
  const formatted = formatValue(props.value)

  if (typeof formatted === 'string') {
    return formatted
  }

  if (typeof formatted === 'number') {
    return String(formatted)
  }

  // 如果是 HTML 标签，提取文本内容
  if (typeof formatted === 'object' && formatted !== null) {
    // 简单提取，实际可能需要更复杂的逻辑
    return JSON.stringify(formatted)
  }

  return String(formformed || '')
}

// 复制文本
async function handleCopy() {
  const text = getDisplayText()

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('已复制到剪贴板')
  }
}
</script>

<style scoped>
.column-renderer {
  display: inline-block;
  max-width: 100%;
}

.copyable-text {
  cursor: pointer;
  color: var(--el-color-primary);
  transition: color 0.2s;
}

.copyable-text:hover {
  color: var(--el-color-primary-light-3);
}

.copy-icon {
  margin-left: 4px;
  font-size: 12px;
}

.ellipsis-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>