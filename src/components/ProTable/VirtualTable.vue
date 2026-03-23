<template>
  <div class="virtual-table-container">
    <div
      ref="tableContainer"
      class="virtual-table-wrapper"
      :style="{ height: containerHeight + 'px' }"
      @scroll="handleScroll"
    >
      <div class="virtual-table-content" :style="{ height: totalHeight + 'px' }">
        <table
          class="virtual-table"
          :style="{ transform: `translateY(${translateY}px)` }"
        >
          <thead>
            <tr>
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
              <td
                v-for="column in columns"
                :key="column.dataIndex"
                :style="{ width: column.width + 'px', minWidth: column.width + 'px' }"
                class="virtual-table-cell"
              >
                <div class="cell-content">
                  <slot
                    v-if="$slots[column.dataIndex]"
                    :name="column.dataIndex"
                    :row="row"
                    :value="row[column.dataIndex]"
                  />
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import ColumnRenderer from './ColumnRenderer.vue'
import type { ColumnProps } from './types'

interface Props {
  columns: ColumnProps[]
  data: any[]
  loading?: boolean
  rowKey?: string | ((record: any) => string)
  estimatedRowHeight?: number
  buffer?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  rowKey: 'id',
  estimatedRowHeight: 55,
  buffer: 5
})

const emit = defineEmits<{
  (e: 'row-click', row: any, event: Event): void
}>()

// 容器引用
const tableContainer = ref<HTMLDivElement>()

// 状态
const scrollTop = ref(0)
const containerHeight = ref(600) // 默认高度
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
function getRowKey(row: any): string {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey] || String(row)
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
    containerHeight.value = Math.max(300, parentHeight - 100) // 减去一些边距
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

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>