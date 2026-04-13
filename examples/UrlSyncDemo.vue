<template>
  <div class="url-sync-demo">
    <div class="demo-header">
      <h1>URL 状态同步测试</h1>
      <p>测试表格状态与URL双向同步，支持链接分享和页面刷新后状态还原</p>
    </div>

    <div class="url-panel">
      <div class="url-text">{{ currentUrl }}</div>
      <el-space>
        <el-button size="small" @click="copyUrl">复制链接</el-button>
        <el-button size="small" @click="refreshPage">刷新页面</el-button>
        <el-button size="small" type="danger" @click="resetState">重置</el-button>
      </el-space>
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

    <div class="test-steps">
      <h3>测试步骤</h3>
      <ol>
        <li>
          <strong>测试分页同步</strong>
          <span>点击表格底部的分页按钮，切换到第2页或修改每页条数，观察URL变化</span>
        </li>
        <li>
          <strong>测试排序同步</strong>
          <span>点击"ID"、"姓名"、"年龄"或"创建时间"列头进行排序，观察URL中的sorter参数</span>
        </li>
        <li>
          <strong>测试筛选同步</strong>
          <span>点击"状态"列的筛选图标，选择"活跃"或"禁用"，观察URL中的filters参数</span>
        </li>
        <li>
          <strong>测试刷新还原</strong>
          <span>完成上述操作后，点击"刷新页面"按钮，验证表格状态是否精准还原</span>
        </li>
        <li>
          <strong>测试链接分享</strong>
          <span>点击"复制链接"按钮，在新的浏览器标签页中打开，验证状态一致性</span>
        </li>
        <li>
          <strong>测试重置功能</strong>
          <span>点击"重置"按钮，清除所有URL参数，表格恢复初始状态</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProTable from '../src/components/ProTable/ProTable.vue'
import type { ColumnProps, RequestParams, TableData } from '../src/components/ProTable/types'

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

  return {
    data: filteredData.slice(start, end),
    total: filteredData.length,
    success: true,
  }
}

function copyUrl() {
  navigator.clipboard
    .writeText(currentUrl.value)
    .then(() => {
      ElMessage.success('链接已复制')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
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
.url-sync-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 20px;
}

.demo-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.demo-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.url-panel {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 20px;
}

.url-text {
  flex: 1;
  font-family: monospace;
  font-size: 13px;
  color: #409eff;
  word-break: break-all;
}

.test-steps {
  margin-top: 30px;
  padding: 20px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 6px;
}

.test-steps h3 {
  margin: 0 0 15px 0;
  color: #d48806;
  font-size: 16px;
}

.test-steps ol {
  margin: 0;
  padding-left: 20px;
}

.test-steps li {
  margin-bottom: 12px;
  line-height: 1.6;
  color: #595959;
}

.test-steps li:last-child {
  margin-bottom: 0;
}

.test-steps strong {
  color: #262626;
}

.test-steps span {
  display: block;
  margin-top: 4px;
  padding-left: 10px;
  font-size: 13px;
  color: #8c8c8c;
}
</style>
