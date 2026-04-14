<template>
  <div class="page-container">
    <div class="info-panel">
      <h3 class="info-title">导出功能</h3>
      <p class="info-desc">
        支持 Excel (.xlsx) 和 CSV 两种格式导出。自动根据 valueType
        格式化数据，支持自定义渲染导出，可通过 hideInExport 控制列是否导出。
      </p>

      <div class="test-section">
        <h4 class="test-title">测试步骤</h4>
        <ol class="test-steps">
          <li>点击 <strong>导出 Excel</strong> 按钮，下载 .xlsx 文件</li>
          <li>打开文件检查：表头、数据格式、列宽</li>
          <li>点击 <strong>导出 CSV</strong> 按钮，下载 .csv 文件</li>
          <li>验证 <strong>hideInExport</strong> 列（备注列）未被导出</li>
          <li>检查枚举列（状态）导出的是中文而非代码值</li>
          <li>检查货币、百分比等 valueType 格式化是否正确</li>
        </ol>
      </div>

      <div class="note-card">
        <div class="note-title">导出规则说明</div>
        <ul class="note-list">
          <li>customRender / formatter 会参与导出</li>
          <li>valueType 自动格式化 (货币、百分比、日期)</li>
          <li>hideInExport: true 的列不会导出</li>
          <li>CSV 导出自动添加 BOM 头解决中文乱码</li>
        </ul>
      </div>
    </div>

    <div class="table-panel">
      <div class="export-actions">
        <el-button type="success" @click="handleExportExcel">导出 Excel</el-button>
        <el-button type="warning" @click="handleExportCsv">导出 CSV</el-button>
      </div>

      <ProTable
        ref="tableRef"
        :columns="columns"
        :request="fetchData"
        row-key="id"
        :pagination="{ pageSizes: [5, 10, 20] }"
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable from '../../src/components/ProTable/ProTable.vue'
import { exportToExcel, exportToCsv } from '../../src/components/ProTable/utils/export'
import type { ColumnProps, RequestParams, TableData } from '../../src/components/ProTable/types'

const tableRef = ref()

const columns: ColumnProps[] = [
  { dataIndex: 'id', title: 'ID', width: 80, sorter: true },
  { dataIndex: 'name', title: '姓名', width: 150, sorter: true },
  {
    dataIndex: 'amount',
    title: '金额',
    width: 120,
    valueType: 'money',
    sorter: true,
  },
  {
    dataIndex: 'rate',
    title: '完成率',
    width: 100,
    valueType: 'percent',
  },
  {
    dataIndex: 'status',
    title: '状态',
    width: 100,
    valueType: 'enum',
    valueEnum: {
      active: { text: '活跃', status: 'success' },
      inactive: { text: '禁用', status: 'info' },
    },
    filters: [
      { text: '活跃', value: 'active' },
      { text: '禁用', value: 'inactive' },
    ],
  },
  { dataIndex: 'createdAt', title: '创建时间', width: 180, valueType: 'dateTime', sorter: true },
  {
    dataIndex: 'remark',
    title: '备注',
    width: 150,
    hideInExport: true,
  },
]

const mockData = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `用户 ${i + 1}`,
  amount: Math.round((Math.random() * 10000 + 100) * 100) / 100,
  rate: Math.round(Math.random() * 100) / 100,
  status: Math.random() > 0.5 ? 'active' : 'inactive',
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  remark: `这是第 ${i + 1} 条备注信息，不会被导出`,
}))

const allData = ref(mockData)

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

function handleExportExcel() {
  exportToExcel(columns, allData.value, 'protable-export.xlsx')
  ElMessage.success('Excel 文件已导出')
}

function handleExportCsv() {
  exportToCsv(columns, allData.value, 'protable-export.csv')
  ElMessage.success('CSV 文件已导出')
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

.note-list {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: #606266;
  line-height: 2;
}

.table-panel {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.export-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
</style>
