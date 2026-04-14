<template>
  <div class="page-container">
    <div class="info-panel">
      <h3 class="info-title">基础表格功能</h3>
      <p class="info-desc">
        展示 ProTable 的核心能力，包括列排序、数据筛选、分页、自定义渲染、操作列等基础功能。
      </p>
      <div class="test-section">
        <h4 class="test-title">测试步骤</h4>
        <ol class="test-steps">
          <li>点击表头 <strong>ID / 姓名 / 年龄 / 创建时间</strong> 进行升降序排序</li>
          <li>在搜索框输入关键词，筛选姓名或邮箱</li>
          <li>点击工具栏 <strong>新增</strong> 按钮查看自定义工具栏</li>
          <li>点击 <strong>操作列</strong> 的编辑/删除按钮</li>
          <li>切换底部分页，修改每页条数</li>
        </ol>
      </div>
    </div>
    <div class="table-panel">
      <ProTable
        :columns="columns"
        :request="fetchData"
        row-key="id"
        :pagination="{ pageSizes: [5, 10, 20, 50] }"
        show-toolbar
      >
        <template #toolbar-left>
          <el-input
            v-model="searchText"
            placeholder="搜索..."
            style="width: 200px"
            @input="handleSearch"
          />
          <el-button type="primary" @click="handleAdd">新增</el-button>
        </template>

        <template #status="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '活跃' : '禁用' }}
          </el-tag>
        </template>

        <template #action="{ row }">
          <el-space>
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </el-space>
        </template>
      </ProTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable from '../../src/components/ProTable/ProTable.vue'
import type { ColumnProps, RequestParams, TableData } from '../../src/components/ProTable/types'

const searchText = ref('')

const columns: ColumnProps[] = [
  { dataIndex: 'id', title: 'ID', width: 80, sorter: true },
  { dataIndex: 'name', title: '姓名', width: 150, sorter: true, ellipsis: true, copyable: true },
  { dataIndex: 'age', title: '年龄', width: 100, valueType: 'digit', sorter: true },
  { dataIndex: 'email', title: '邮箱', width: 200, ellipsis: true },
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
  { dataIndex: 'action', title: '操作', width: 180, fixed: 'right' },
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

  if (searchText.value) {
    filteredData = filteredData.filter(
      (item) => item.name.includes(searchText.value) || item.email.includes(searchText.value)
    )
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

function handleSearch() {
  console.log('搜索:', searchText.value)
}

function handleAdd() {
  ElMessage.info('点击了新增按钮')
}

function handleEdit(row: Record<string, unknown>) {
  ElMessage.success(`编辑用户: ${row.name}`)
}

function handleDelete(row: Record<string, unknown>) {
  ElMessage.warning(`删除用户: ${row.name}`)
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

.table-panel {
  flex: 1;
  padding: 20px;
  overflow: auto;
}
</style>
