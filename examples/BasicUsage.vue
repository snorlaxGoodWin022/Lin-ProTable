<template>
  <div class="demo-container">
    <h1>ProTable 高级表格组件示例</h1>

    <div class="demo-section">
      <h2>基础用法</h2>
      <ProTable
        :columns="columns"
        :request="fetchData"
        row-key="id"
        :pagination="{ pageSizes: [5, 10, 20,50] }"
        show-toolbar
      >
        <!-- 工具栏左侧自定义 -->
        <template #toolbar-left>
          <el-input
            v-model="searchText"
            placeholder="搜索..."
            style="width: 200px"
            @input="handleSearch"
          />
          <el-button type="primary" @click="handleAdd">新增</el-button>
        </template>

        <!-- 自定义状态列渲染 -->
        <template #status="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '活跃' : '禁用' }}
          </el-tag>
        </template>

        <!-- 自定义操作列 -->
        <template #action="{ row }">
          <el-space>
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </el-space>
        </template>
      </ProTable>
    </div>

    <div class="demo-section">
      <h2>虚拟滚动（大数据量）</h2>
      <ProTable
        :columns="simpleColumns"
        :request="fetchLargeData"
        row-key="id"
        :pagination="false"
        :virtual-scroll="{ enabled: true, estimatedRowHeight: 50 }"
      />
    </div>

    <div class="demo-section">
      <h2>URL 状态同步</h2>
      <ProTable
        :columns="columns"
        :request="fetchData"
        row-key="id"
        :sync-url="true"
        show-toolbar
      />
      <p class="demo-tip">
        尝试修改分页、排序、筛选，然后刷新页面或复制链接分享
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable from '../src/components/ProTable/ProTable.vue'
import type { ColumnProps, RequestParams, TableData } from '../src/components/ProTable/types'

// 搜索文本
const searchText = ref('')

// 列配置
const columns: ColumnProps[] = [
  {
    dataIndex: 'id',
    title: 'ID',
    width: 80,
    sorter: true
  },
  {
    dataIndex: 'name',
    title: '姓名',
    width: 150,
    sorter: true,
    ellipsis: true,
    copyable: true
  },
  {
    dataIndex: 'age',
    title: '年龄',
    width: 100,
    valueType: 'digit',
    sorter: true
  },
  {
    dataIndex: 'email',
    title: '邮箱',
    width: 200,
    ellipsis: true
  },
  {
    dataIndex: 'status',
    title: '状态',
    width: 100,
    valueType: 'enum',
    valueEnum: {
      active: { text: '活跃', status: 'success' },
      inactive: { text: '禁用', status: 'info' }
    },
    filters: [
      { text: '活跃', value: 'active' },
      { text: '禁用', value: 'inactive' }
    ]
  },
  {
    dataIndex: 'createdAt',
    title: '创建时间',
    width: 180,
    valueType: 'dateTime',
    sorter: true
  },
  {
    dataIndex: 'action',
    title: '操作',
    width: 180,
    fixed: 'right'
  }
]

// 简单列配置（用于虚拟滚动示例）
const simpleColumns: ColumnProps[] = [
  { dataIndex: 'id', title: 'ID', width: 80 },
  { dataIndex: 'name', title: '姓名', width: 150 },
  { dataIndex: 'age', title: '年龄', width: 100 },
  { dataIndex: 'email', title: '邮箱', width: 200 }
]

// 模拟数据
const mockData = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `用户 ${i + 1}`,
  age: Math.floor(Math.random() * 50) + 18,
  email: `user${i + 1}@example.com`,
  status: Math.random() > 0.5 ? 'active' : 'inactive',
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
}))

// 模拟大数据
const mockLargeData = Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,
  name: `大数据用户 ${i + 1}`,
  age: Math.floor(Math.random() * 50) + 18,
  email: `bigdata${i + 1}@example.com`
}))

// 数据请求函数
async function fetchData(params: RequestParams): Promise<TableData> {
  console.log('请求参数:', params)

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300))

  // 筛选数据
  let filteredData = [...mockData]

  // 搜索
  if (searchText.value) {
    filteredData = filteredData.filter(item =>
      item.name.includes(searchText.value) ||
      item.email.includes(searchText.value)
    )
  }

  // 筛选
  if (params.status) {
    filteredData = filteredData.filter(item => params.status.includes(item.status))
  }

  // 排序
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

  // 分页
  const start = (params.current - 1) * params.pageSize
  const end = start + params.pageSize
  const pageData = filteredData.slice(start, end)

  return {
    data: pageData,
    total: filteredData.length,
    success: true
  }
}

// 大数据请求函数
async function fetchLargeData(params: RequestParams): Promise<TableData> {
  // 模拟大数据加载延迟
  await new Promise(resolve => setTimeout(resolve, 500))

  // 简单分页
  const start = (params.current - 1) * params.pageSize
  const end = start + params.pageSize
  const pageData = mockLargeData.slice(start, end)

  return {
    data: pageData,
    total: mockLargeData.length,
    success: true
  }
}

// 搜索处理
function handleSearch() {
  // 实际使用中，这里应该触发表格刷新
  console.log('搜索:', searchText.value)
}

// 操作处理
function handleAdd() {
  ElMessage.info('点击了新增按钮')
}

function handleEdit(row: any) {
  ElMessage.success(`编辑用户: ${row.name}`)
}

function handleDelete(row: any) {
  ElMessage.warning(`删除用户: ${row.name}`)
}
</script>

<style scoped>
.demo-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: white;
}

.demo-section h2 {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 8px;
}

.demo-tip {
  margin-top: 12px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>