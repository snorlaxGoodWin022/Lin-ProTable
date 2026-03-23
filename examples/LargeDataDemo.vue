<template>
  <div class="large-data-demo">
    <div class="demo-header">
      <h1>大数量表格测试</h1>
      <p>测试虚拟滚动和大数据量下的表格性能</p>
    </div>

    <div class="control-panel">
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

    <div class="table-container">
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
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-tag type="info">总数据量：{{ dataSize }} 条</el-tag>
          <el-tag type="success">加载耗时：{{ loadingTime.toFixed(2) }}ms</el-tag>
          <el-tag v-if="virtualScrollConfig.enabled" type="warning">虚拟滚动已启用</el-tag>
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

    <div class="performance-info">
      <el-alert
        title="性能提示"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <div>
            <p>• 虚拟滚动：只渲染可见区域的行，大幅提升大数据量下的性能（≥5000条自动启用）</p>
            <p>• 分页加载：每次只请求当前页的数据，减少网络传输和渲染压力</p>
            <p>• 性能监控：实时显示数据加载耗时，便于性能对比和优化</p>
            <p>• 建议测试：分别测试1千、1万、5万、10万数据，观察性能差异</p>
          </div>
        </template>
      </el-alert>
    </div>

    <div class="performance-table">
      <h3>性能对比参考</h3>
      <el-table :data="performanceData" style="width: 100%">
        <el-table-column prop="dataSize" label="数据量" width="120" />
        <el-table-column prop="virtualScroll" label="虚拟滚动" width="100">
          <template #default="{ row }">
            <el-tag :type="row.virtualScroll ? 'success' : 'info'" size="small">
              {{ row.virtualScroll ? '启用' : '未启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expectedLCP" label="预期LCP" width="120" />
        <el-table-column prop="expectedTTI" label="预期TTI" width="120" />
        <el-table-column prop="performance" label="性能评级" width="120">
          <template #default="{ row }">
            <el-tag :type="row.performanceType" size="small">
              {{ row.performance }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="recommendation" label="优化建议" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import ProTable from '../src/components/ProTable/ProTable.vue'
import type { ColumnProps, RequestParams, TableData } from '../src/components/ProTable/types'

const tableRef = ref()
const searchText = ref('')
const dataSize = ref(10000)

const paginationConfig = computed(() => ({
  enabled: true,
  pageSizes: [20, 50, 100, 200],
  layout: 'total, sizes, prev, pager, next, jumper'
}))

const virtualScrollConfig = computed(() => ({
  enabled: dataSize.value >= 5000,
  estimatedRowHeight: 50
}))

const columns: ColumnProps[] = [
  { dataIndex: 'id', title: 'ID', width: 100, sorter: true },
  { dataIndex: 'name', title: '姓名', width: 150, sorter: true },
  { dataIndex: 'age', title: '年龄', width: 100, sorter: true },
  { dataIndex: 'department', title: '部门', width: 120 },
  { dataIndex: 'position', title: '职位', width: 120 },
  { dataIndex: 'email', title: '邮箱', width: 200 },
  { dataIndex: 'phone', title: '电话', width: 150 },
  { dataIndex: 'status', title: '状态', width: 100, filters: getStatusFilters() },
  { dataIndex: 'score', title: '评分', width: 150, sorter: true },
  { dataIndex: 'joinDate', title: '入职日期', width: 120, valueType: 'date', sorter: true }
]

function getStatusFilters() {
  return [
    { text: '在职', value: 'active' },
    { text: '离职', value: 'inactive' },
    { text: '休假', value: 'vacation' }
  ]
}

function getStatusType(status: string) {
  const types: Record<string, any> = {
    active: 'success',
    inactive: 'info',
    vacation: 'warning'
  }
  return types[status] || 'info'
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    active: '在职',
    inactive: '离职',
    vacation: '休假'
  }
  return texts[status] || status
}

function getScoreColor(score: number) {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const mockData = ref<any[]>([])
const loadingTime = ref(0)
const lastFetchTime = ref(0)

const performanceData = [
  {
    dataSize: '1千',
    virtualScroll: false,
    expectedLCP: '< 1.0s',
    expectedTTI: '< 1.5s',
    performance: '优秀',
    performanceType: 'success',
    recommendation: '无需优化'
  },
  {
    dataSize: '5千',
    virtualScroll: true,
    expectedLCP: '< 1.5s',
    expectedTTI: '< 2.0s',
    performance: '良好',
    performanceType: 'success',
    recommendation: '启用虚拟滚动'
  },
  {
    dataSize: '1万',
    virtualScroll: true,
    expectedLCP: '< 2.0s',
    expectedTTI: '< 2.5s',
    performance: '良好',
    performanceType: 'success',
    recommendation: '启用虚拟滚动 + 分页'
  },
  {
    dataSize: '5万',
    virtualScroll: true,
    expectedLCP: '< 2.5s',
    expectedTTI: '< 3.0s',
    performance: '中等',
    performanceType: 'warning',
    recommendation: '启用虚拟滚动 + 优化分页'
  },
  {
    dataSize: '10万',
    virtualScroll: true,
    expectedLCP: '< 3.0s',
    expectedTTI: '< 3.5s',
    performance: '中等',
    performanceType: 'warning',
    recommendation: '启用虚拟滚动 + 按需加载'
  }
]

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
    joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 5).toISOString().split('T')[0]
  }))
}

async function fetchData(params: RequestParams): Promise<TableData> {
  const startTime = performance.now()
  console.log('请求数据，参数:', params)

  await new Promise(resolve => setTimeout(resolve, 200))

  let filteredData = [...mockData.value]

  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    filteredData = filteredData.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.email.toLowerCase().includes(searchLower) ||
      item.phone.includes(searchText.value)
    )
  }

  if (params.status && params.status.length > 0) {
    filteredData = filteredData.filter(item => params.status.includes(item.status))
  }

  if (params.sortField && params.sortOrder) {
    filteredData.sort((a, b) => {
      const aVal = a[params.sortField!]
      const bVal = b[params.sortField!]
      if (params.sortOrder === 'ascend') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }

  const start = (params.current - 1) * params.pageSize
  const end = start + params.pageSize

  const endTime = performance.now()
  const fetchTime = endTime - startTime
  loadingTime.value = fetchTime
  lastFetchTime.value = Date.now()

  console.log(`数据加载完成，耗时: ${fetchTime.toFixed(2)}ms，数据量: ${filteredData.length}，返回: ${end - start}条`)

  return {
    data: filteredData.slice(start, end),
    total: filteredData.length,
    success: true
  }
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
  ElMessage.success(`已生成 ${dataSize.value} 条测试数据`)
}

refreshData()
</script>

<style scoped>
.large-data-demo {
  padding: 20px;
  max-width: 1400px;
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

.control-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 20px;
}

.table-container {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 20px;
}

.performance-info {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 6px;
  padding: 16px;
}

.performance-info p {
  margin: 8px 0;
  color: #595959;
  font-size: 14px;
}

.performance-table {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 20px;
  margin-top: 20px;
}

.performance-table h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}
</style>
