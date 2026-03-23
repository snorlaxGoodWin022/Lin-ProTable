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
        @row-click="handleRowClick"
      >
        <!-- 透传所有表格插槽 -->
        <template v-for="(_, name) in $slots" #[name]="slotData">
          <slot :name="name" v-bind="slotData || {}" />
        </template>
      </ProVirtualTable>
    </template>
    <template v-else>
      <el-table
        v-bind="$attrs"
        :data="dataSource"
        :row-key="rowKey"
        :loading="loading"
        @sort-change="handleSortChange"
        @filter-change="handleFilterChange"
      >
        <template v-for="column in processedColumns" :key="column.dataIndex">
          <el-table-column
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
              <slot
                v-if="$slots[column.dataIndex]"
                :name="column.dataIndex"
                :row="scope.row"
                :index="scope.$index"
                :value="scope.row[column.dataIndex]"
              />
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
import { ref, computed, watch, onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ProTableToolbar from './Toolbar.vue'
import ProVirtualTable from './VirtualTable.vue'
import ColumnRenderer from './ColumnRenderer.vue'
import { exportToExcel } from './utils/export'
import { useTableState } from './hooks/useTableState'
import { useColumnState } from './hooks/useColumnState'
import { useUrlSync } from './hooks/useUrlSync'
import type { ColumnProps, ProTableProps, TableState, TableData } from './types'

const props = withDefaults(defineProps<ProTableProps>(), {
  rowKey: 'id',
  showToolbar: true,
  pagination: () => ({ enabled: true, pageSizes: [10, 20, 50, 100], layout: 'total, sizes, prev, pager, next, jumper' }),
  virtualScroll: () => ({ enabled: false, estimatedRowHeight: 55 }),
  syncUrl: true,
  editMode: undefined
})

const emit = defineEmits<{
  (e: 'change', state: TableState): void
  (e: 'row-click', row: any, event: Event): void
  (e: 'update:params', params: any): void
}>()

// 状态管理
const { tableState, setTableState, resetTableState } = useTableState()
const { columnState, processedColumns, updateColumnState } = useColumnState(props.columns)

// URL 同步
if (props.syncUrl) {
  const { initFromUrl } = useUrlSync(tableState, () => fetchData())
  // 初始化时从URL读取状态
  initFromUrl()
}

// 表格数据
const dataSource = ref<any[]>([])
const loading = ref(false)
const total = ref(0)

// 分页配置
const pagination = computed(() => {
  if (props.pagination === false) {
    return { enabled: false }
  }
  return {
    enabled: true,
    pageSizes: [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next, jumper',
    ...(typeof props.pagination === 'object' ? props.pagination : {})
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
    ...(typeof props.virtualScroll === 'object' ? props.virtualScroll : {})
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
      ...props.params
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
function handleSortChange({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) {
  if (order) {
    setTableState({
      sorter: {
        field: prop,
        order: order === 'ascending' ? 'ascend' : 'descend'
      },
      current: 1 // 排序后回到第一页
    })
  } else {
    setTableState({ sorter: null })
  }
  fetchData()
}

function handleFilterChange(filters: Record<string, any[]>) {
  const activeFilters: Record<string, any[]> = {}
  Object.keys(filters).forEach(key => {
    if (filters[key] && filters[key].length > 0) {
      activeFilters[key] = filters[key]
    }
  })

  // 筛选变化时重置到第一页
  setTableState({
    filters: activeFilters,
    current: 1
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

function handleRowClick(row: any, event: Event) {
  emit('row-click', row, event)
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
  resetTableState
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
</style>