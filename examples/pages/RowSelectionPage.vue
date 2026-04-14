<template>
  <div class="page-container">
    <div class="info-panel">
      <h3 class="info-title">行选择功能</h3>
      <p class="info-desc">
        支持 checkbox 多选和 radio
        单选两种模式。多选支持跨页选中、全选和批量操作；单选适用于选择单条记录的场景。
      </p>

      <div class="test-section">
        <h4 class="test-title">测试步骤</h4>
        <ol class="test-steps">
          <li>点击表头复选框 <strong>全选/取消全选</strong>（ID 1-3 行被禁用，无法选中）</li>
          <li>点击单行复选框选中/取消</li>
          <li>翻页后返回，验证 <strong>跨页选中</strong> 保留</li>
          <li>选中行后顶部出现 <strong>批量操作栏</strong></li>
          <li>切换到 <strong>单选模式</strong>，验证只能选一行</li>
          <li>观察 <strong>灰色半透明行</strong> 为禁用行（ID 1-3），不可选中</li>
        </ol>
      </div>

      <div class="mode-switch">
        <h4 class="mode-title">选择模式</h4>
        <el-radio-group v-model="selectionType" @change="handleModeChange">
          <el-radio-button value="checkbox">多选</el-radio-button>
          <el-radio-button value="radio">单选</el-radio-button>
        </el-radio-group>
      </div>

      <div class="note-card" style="margin-top: 16px">
        <div class="note-title">当前选中</div>
        <div class="selection-info">
          <p v-if="currentSelectedKeys.length === 0" class="empty-text">暂未选中任何行</p>
          <p v-else>
            已选 <strong>{{ currentSelectedKeys.length }}</strong> 行
          </p>
          <div v-if="currentSelectedKeys.length > 0" class="selected-keys">
            <el-tag v-for="key in currentSelectedKeys" :key="key" size="small" class="key-tag">
              ID: {{ key }}
            </el-tag>
          </div>
        </div>
      </div>

      <div class="warn-card">
        <div class="warn-title">禁用行说明</div>
        <p class="warn-text">
          通过 <code>getCheckboxProps</code> 配置禁用条件。本示例中
          <strong>ID 小于等于 3 的行</strong>被禁用（半透明灰色显示），无法被选中。
        </p>
      </div>
    </div>

    <div class="table-panel">
      <!-- 批量操作栏 -->
      <div v-if="selectionType === 'checkbox' && currentSelectedKeys.length > 0" class="batch-bar">
        <span class="batch-text">
          已选择 <strong>{{ currentSelectedKeys.length }}</strong> 项
        </span>
        <el-space>
          <el-button size="small" type="danger" @click="handleBatchDelete">批量删除</el-button>
          <el-button size="small" @click="handleBatchExport">批量导出</el-button>
          <el-button size="small" @click="handleClearSelection">清空选择</el-button>
        </el-space>
      </div>

      <ProTable
        ref="tableRef"
        :columns="columns"
        :request="fetchData"
        row-key="id"
        :row-selection="rowSelectionConfig"
        :pagination="{ pageSizes: [5, 10, 20] }"
        show-toolbar
        @selection-change="handleSelectionChange"
      >
        <template #status="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '活跃' : '禁用' }}
          </el-tag>
        </template>
      </ProTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable from '../../src/components/ProTable/ProTable.vue'
import type {
  ColumnProps,
  RequestParams,
  TableData,
  RowSelectionOptions,
} from '../../src/components/ProTable/types'

const tableRef = ref()
const selectionType = ref<'checkbox' | 'radio'>('checkbox')
const currentSelectedKeys = ref<(string | number)[]>([])
const currentSelectedRows = ref<Record<string, unknown>[]>([])

const columns: ColumnProps[] = [
  { dataIndex: 'id', title: 'ID', width: 80, sorter: true },
  { dataIndex: 'name', title: '姓名', width: 120, sorter: true, copyable: true },
  { dataIndex: 'age', title: '年龄', width: 80, valueType: 'digit' },
  { dataIndex: 'email', title: '邮箱', width: 200, ellipsis: true },
  { dataIndex: 'phone', title: '电话', width: 150 },
  {
    dataIndex: 'status',
    title: '状态',
    width: 100,
    valueType: 'enum',
    valueEnum: {
      active: { text: '活跃', status: 'success' },
      inactive: { text: '禁用', status: 'info' },
    },
  },
  { dataIndex: 'createdAt', title: '创建时间', width: 180, valueType: 'dateTime', sorter: true },
]

// 行选择配置
const rowSelectionConfig = computed<RowSelectionOptions | false>(() => {
  return {
    type: selectionType.value,
    onChange(keys, rows) {
      currentSelectedKeys.value = keys
      currentSelectedRows.value = rows
    },
    // ID <= 3 的行禁用选择
    getCheckboxProps(record) {
      return { disabled: (record.id as number) <= 3 }
    },
    columnWidth: 48,
    fixed: true,
  }
})

const mockData = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `用户 ${i + 1}`,
  age: Math.floor(Math.random() * 50) + 18,
  email: `user${i + 1}@example.com`,
  phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
  status: Math.random() > 0.5 ? 'active' : 'inactive',
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
}))

async function fetchData(params: RequestParams): Promise<TableData> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  let filteredData = [...mockData]

  if (params.sortField && params.sortOrder) {
    filteredData.sort((a, b) => {
      const aVal = a[params.sortField!]
      const bVal = b[params.sortField!]
      return params.sortOrder === 'ascend' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
    })
  }

  const start = (params.current - 1) * params.pageSize
  const end = start + params.pageSize

  return { data: filteredData.slice(start, end), total: filteredData.length, success: true }
}

function handleSelectionChange(keys: (string | number)[], rows: Record<string, unknown>[]) {
  currentSelectedKeys.value = keys
  currentSelectedRows.value = rows
}

function handleModeChange() {
  currentSelectedKeys.value = []
  currentSelectedRows.value = []
}

function handleBatchDelete() {
  // 从 mockData 中移除选中的行
  const deleteSet = new Set(currentSelectedKeys.value)
  const deleteCount = mockData.length
  for (let i = mockData.length - 1; i >= 0; i--) {
    if (deleteSet.has(mockData[i].id)) {
      mockData.splice(i, 1)
    }
  }
  const removed = deleteCount - mockData.length
  // 清空选择并刷新表格
  tableRef.value?.clearSelection()
  currentSelectedKeys.value = []
  currentSelectedRows.value = []
  tableRef.value?.refresh()
  ElMessage.success(`成功删除 ${removed} 条数据，剩余 ${mockData.length} 条`)
}

function handleBatchExport() {
  ElMessage.success(`导出 ${currentSelectedKeys.value.length} 条数据`)
  console.log('选中的行:', currentSelectedRows.value)
}

function handleClearSelection() {
  tableRef.value?.clearSelection()
}
</script>

<style scoped>
.page-container {
  display: flex;
  height: 100vh;
}

.info-panel {
  width: 280px;
  flex-shrink: 0;
  padding: 24px 20px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.info-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}

.info-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 20px;
}

.test-section {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 6px;
  padding: 14px;
  margin-bottom: 16px;
}

.test-title {
  font-size: 14px;
  color: #67c23a;
  margin: 0 0 10px;
}

.test-steps {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #606266;
  line-height: 2;
}

.test-steps li strong {
  color: #303133;
}

.mode-switch {
  margin-bottom: 16px;
}

.mode-title {
  font-size: 14px;
  color: #303133;
  margin: 0 0 8px;
  font-weight: 600;
}

.note-card {
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 6px;
  padding: 14px;
}

.note-title {
  font-size: 14px;
  color: #e6a23c;
  margin: 0 0 10px;
  font-weight: 600;
}

.warn-card {
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  padding: 14px;
  margin-top: 12px;
}

.warn-title {
  font-size: 14px;
  color: #f56c6c;
  margin: 0 0 8px;
  font-weight: 600;
}

.warn-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.warn-text code {
  background: rgba(245, 108, 108, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
  color: #f56c6c;
}

.selection-info {
  font-size: 13px;
  color: #606266;
}

.empty-text {
  color: #909399;
  font-size: 12px;
}

.selected-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.key-tag {
  font-size: 11px;
}

.table-panel {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  margin-bottom: 12px;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 4px;
}

.batch-text {
  font-size: 13px;
  color: #409eff;
}
</style>
