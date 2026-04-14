<template>
  <div class="page-container">
    <div class="info-panel">
      <h3 class="info-title">URL 状态同步</h3>
      <p class="info-desc">
        表格状态（分页、排序、筛选）与 URL
        双向绑定。刷新页面后状态自动恢复，支持通过链接分享当前表格状态。
      </p>

      <div class="test-section">
        <h4 class="test-title">测试步骤</h4>
        <ol class="test-steps">
          <li>点击底部分页切换到第 2 页，观察 URL 变化</li>
          <li>点击 <strong>ID / 姓名 / 年龄</strong> 列头排序</li>
          <li>点击 <strong>状态</strong> 列的筛选图标选择筛选条件</li>
          <li>点击下方 <strong>刷新页面</strong>，验证状态还原</li>
          <li>点击 <strong>复制链接</strong>，在新标签页打开验证一致性</li>
          <li>点击 <strong>重置</strong> 清空所有状态</li>
        </ol>
      </div>

      <div class="url-display">
        <div class="url-label">当前 URL</div>
        <div class="url-text">{{ currentUrl }}</div>
      </div>
    </div>

    <div class="table-panel">
      <div class="url-actions">
        <el-button size="small" @click="copyUrl">复制链接</el-button>
        <el-button size="small" @click="refreshPage">刷新页面</el-button>
        <el-button size="small" type="danger" @click="resetState">重置</el-button>
      </div>
      <ProTable
        ref="tableRef"
        :columns="columns"
        :request="fetchData"
        row-key="id"
        :pagination="{ pageSizes: [5, 10, 20, 50] }"
        :sync-url="true"
        show-toolbar
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
import { ElMessage, ElMessageBox } from 'element-plus'
import ProTable from '../../src/components/ProTable/ProTable.vue'
import type { ColumnProps, RequestParams, TableData } from '../../src/components/ProTable/types'

const tableRef = ref()
const currentUrl = computed(() => window.location.href)

const columns: ColumnProps[] = [
  { dataIndex: 'id', title: 'ID', width: 80, sorter: true },
  { dataIndex: 'name', title: '姓名', width: 150, sorter: true },
  { dataIndex: 'age', title: '年龄', width: 100, sorter: true },
  { dataIndex: 'email', title: '邮箱', width: 200 },
  {
    dataIndex: 'status',
    title: '状态',
    width: 100,
    filters: [
      { text: '活跃', value: 'active' },
      { text: '禁用', value: 'inactive' },
    ],
  },
  { dataIndex: 'createdAt', title: '创建时间', width: 180, valueType: 'dateTime', sorter: true },
]

const mockData = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `用户 ${i + 1}`,
  age: Math.floor(Math.random() * 50) + 18,
  email: `user${i + 1}@example.com`,
  status: Math.random() > 0.5 ? 'active' : 'inactive',
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
}))

async function fetchData(params: RequestParams): Promise<TableData> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  let filteredData = [...mockData]

  if (params.status && params.status.length > 0) {
    filteredData = filteredData.filter((item) => params.status.includes(item.status))
  }

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

function copyUrl() {
  navigator.clipboard
    .writeText(currentUrl.value)
    .then(() => ElMessage.success('链接已复制'))
    .catch(() => ElMessage.error('复制失败'))
}

function refreshPage() {
  window.location.reload()
}

function resetState() {
  ElMessageBox.confirm('确定重置所有状态？', '确认', { type: 'warning' })
    .then(() => {
      window.location.href = window.location.pathname
    })
    .catch(() => {})
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

.url-display {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
}

.url-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.url-text {
  font-family: monospace;
  font-size: 11px;
  color: #409eff;
  word-break: break-all;
  line-height: 1.5;
}

.table-panel {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.url-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
