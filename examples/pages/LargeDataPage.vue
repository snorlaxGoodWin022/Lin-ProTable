<template>
  <div class="page-container">
    <div class="info-panel">
      <h3 class="info-title">大数据虚拟滚动</h3>
      <p class="info-desc">
        测试虚拟滚动在大数据量下的渲染性能。只渲染可见区域的行，支持万级数据流畅滚动。数据量 ≥5000
        时自动启用虚拟滚动。
      </p>

      <div class="test-section">
        <h4 class="test-title">测试步骤</h4>
        <ol class="test-steps">
          <li>选择不同数据量 (1K / 10K / 50K / 100K)</li>
          <li>滚动表格，观察渲染流畅度</li>
          <li>在搜索框输入关键词进行筛选</li>
          <li>点击状态列筛选，观察性能</li>
          <li>观察工具栏的 <strong>加载耗时</strong> 指标</li>
          <li>对比不同数据量下的性能表现</li>
        </ol>
      </div>

      <div class="stats-card">
        <div class="stat-item">
          <span class="stat-label">数据量</span>
          <el-tag type="info" size="small">{{ dataSize.toLocaleString() }} 条</el-tag>
        </div>
        <div class="stat-item">
          <span class="stat-label">加载耗时</span>
          <el-tag type="success" size="small">{{ loadingTime.toFixed(2) }}ms</el-tag>
        </div>
        <div class="stat-item">
          <span class="stat-label">虚拟滚动</span>
          <el-tag :type="virtualScrollConfig.enabled ? 'warning' : 'info'" size="small">
            {{ virtualScrollConfig.enabled ? '已启用' : '未启用' }}
          </el-tag>
        </div>
      </div>
    </div>

    <div class="table-panel">
      <div class="control-bar">
        <el-space>
          <span>数据量：</span>
          <el-radio-group v-model="dataSize" @change="handleDataSizeChange">
            <el-radio-button :label="1000">1千</el-radio-button>
            <el-radio-button :label="10000">1万</el-radio-button>
            <el-radio-button :label="50000">5万</el-radio-button>
            <el-radio-button :label="100000">10万</el-radio-button>
          </el-radio-group>
          <el-button type="primary" @click="refreshData">刷新数据</el-button>
        </el-space>
      </div>

      <ProTable
        ref="tableRef"
        :columns="columns"
        :request="fetchData"
        row-key="id"
        :pagination="paginationConfig"
        :virtual-scroll="virtualScrollConfig"
        show-toolbar
      >
        <template #toolbar-left>
          <el-input
            v-model="searchText"
            placeholder="搜索姓名..."
            style="width: 200px"
            clearable
            @input="handleSearch"
          />
        </template>

        <template #status="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>

        <template #score="{ row }">
          <el-progress
            :percentage="row.score"
            :color="getScoreColor(row.score)"
            :stroke-width="12"
          />
        </template>
      </ProTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable from '../../src/components/ProTable/ProTable.vue'
import type { ColumnProps, RequestParams, TableData } from '../../src/components/ProTable/types'

const tableRef = ref()
const searchText = ref('')
const dataSize = ref(10000)
const loadingTime = ref(0)

const paginationConfig = computed(() => ({
  enabled: true,
  pageSizes: [20, 50, 100, 200],
  layout: 'total, sizes, prev, pager, next, jumper',
}))

const virtualScrollConfig = computed(() => ({
  enabled: dataSize.value >= 5000,
  estimatedRowHeight: 50,
}))

const columns: ColumnProps[] = [
  { dataIndex: 'id', title: 'ID', width: 100, sorter: true },
  { dataIndex: 'name', title: '姓名', width: 150, sorter: true },
  { dataIndex: 'age', title: '年龄', width: 100, sorter: true },
  { dataIndex: 'department', title: '部门', width: 120 },
  { dataIndex: 'position', title: '职位', width: 120 },
  { dataIndex: 'email', title: '邮箱', width: 200 },
  { dataIndex: 'phone', title: '电话', width: 150 },
  {
    dataIndex: 'status',
    title: '状态',
    width: 100,
    filters: [
      { text: '在职', value: 'active' },
      { text: '离职', value: 'inactive' },
      { text: '休假', value: 'vacation' },
    ],
  },
  { dataIndex: 'score', title: '评分', width: 150, sorter: true },
  { dataIndex: 'joinDate', title: '入职日期', width: 120, valueType: 'date', sorter: true },
]

function getStatusType(status: string) {
  const types: Record<string, string> = { active: 'success', inactive: 'info', vacation: 'warning' }
  return types[status] || 'info'
}

function getStatusText(status: string) {
  const texts: Record<string, string> = { active: '在职', inactive: '离职', vacation: '休假' }
  return texts[status] || status
}

function getScoreColor(score: number) {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const mockData = ref<Record<string, unknown>[]>([])

function generateMockData(count: number) {
  const departments = ['技术部', '产品部', '运营部', '市场部', '人事部', '财务部']
  const positions = ['工程师', '设计师', '产品经理', '运营专员', '市场经理', '人事专员', '财务专员']
  const statuses = ['active', 'inactive', 'vacation']

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `员工 ${i + 1}`,
    age: Math.floor(Math.random() * 40) + 22,
    department: departments[Math.floor(Math.random() * departments.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    email: `employee${i + 1}@company.com`,
    phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    score: Math.floor(Math.random() * 100),
    joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 5)
      .toISOString()
      .split('T')[0],
  }))
}

async function fetchData(params: RequestParams): Promise<TableData> {
  const startTime = performance.now()
  await new Promise((resolve) => setTimeout(resolve, 200))

  let filteredData = [...mockData.value]

  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    filteredData = filteredData.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.email.toLowerCase().includes(searchLower) ||
        item.phone.includes(searchText.value)
    )
  }

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

  loadingTime.value = performance.now() - startTime

  return { data: filteredData.slice(start, end), total: filteredData.length, success: true }
}

function handleDataSizeChange() {
  refreshData()
}

function handleSearch() {
  if (tableRef.value) {
    tableRef.value.refresh()
  }
}

function refreshData() {
  mockData.value = generateMockData(dataSize.value)
  if (tableRef.value) {
    tableRef.value.refresh()
  }
  ElMessage.success(`已生成 ${dataSize.value.toLocaleString()} 条测试数据`)
}

refreshData()
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

.stats-card {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 13px;
  color: #606266;
}

.table-panel {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.control-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 16px;
}
</style>
