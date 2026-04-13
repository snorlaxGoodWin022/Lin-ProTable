<template>
  <div class="demo-container">
    <h1>ProTable 行内编辑示例</h1>

    <!-- 单元格编辑模式 -->
    <div class="demo-section">
      <h2>单元格编辑 (cell 模式)</h2>
      <p class="demo-tip">点击单元格直接编辑，Enter 保存，Esc 取消，点击外部自动保存</p>
      <ProTable
        :columns="cellEditColumns"
        :request="fetchData"
        row-key="id"
        edit-mode="cell"
        :on-save="handleCellSave"
        :pagination="{ pageSizes: [5, 10, 20] }"
        show-toolbar
      />
    </div>

    <!-- 整行编辑模式 -->
    <div class="demo-section">
      <h2>整行编辑 (row 模式)</h2>
      <p class="demo-tip">点击"编辑"按钮进入整行编辑，修改多个字段后统一保存</p>
      <ProTable
        :columns="rowEditColumns"
        :request="fetchData"
        row-key="id"
        edit-mode="row"
        :on-save="handleRowSave"
        :pagination="{ pageSizes: [5, 10, 20] }"
        show-toolbar
      >
        <!-- 自定义 action 列的额外操作按钮 -->
        <template #action-extra="{ row }">
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </ProTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable from '../src/components/ProTable/ProTable.vue'
import type {
  ColumnProps,
  RequestParams,
  TableData,
  EditSaveParams,
} from '../src/components/ProTable/types'

// ---- 单元格编辑列配置 ----
const cellEditColumns: ColumnProps[] = [
  {
    dataIndex: 'id',
    title: 'ID',
    width: 80,
    sorter: true,
  },
  {
    dataIndex: 'name',
    title: '姓名',
    width: 150,
    editable: {
      type: 'input',
      placeholder: '请输入姓名',
    },
  },
  {
    dataIndex: 'age',
    title: '年龄',
    width: 120,
    editable: {
      type: 'number',
      props: { min: 0, max: 150 },
    },
  },
  {
    dataIndex: 'email',
    title: '邮箱',
    width: 220,
    editable: {
      type: 'input',
      placeholder: '请输入邮箱',
    },
  },
  {
    dataIndex: 'status',
    title: '状态',
    width: 130,
    valueType: 'enum',
    valueEnum: {
      active: { text: '活跃', status: 'success' },
      inactive: { text: '禁用', status: 'info' },
    },
    editable: {
      type: 'select',
      options: [
        { label: '活跃', value: 'active' },
        { label: '禁用', value: 'inactive' },
      ],
      placeholder: '选择状态',
    },
  },
  {
    dataIndex: 'createdAt',
    title: '创建时间',
    width: 180,
    valueType: 'dateTime',
    sorter: true,
  },
]

// ---- 整行编辑列配置 ----
const rowEditColumns: ColumnProps[] = [
  {
    dataIndex: 'id',
    title: 'ID',
    width: 80,
  },
  {
    dataIndex: 'name',
    title: '姓名',
    width: 150,
    editable: {
      type: 'input',
      placeholder: '请输入姓名',
    },
  },
  {
    dataIndex: 'age',
    title: '年龄',
    width: 120,
    editable: {
      type: 'number',
      props: { min: 0, max: 150 },
    },
  },
  {
    dataIndex: 'email',
    title: '邮箱',
    width: 220,
    editable: {
      type: 'input',
      placeholder: '请输入邮箱',
    },
  },
  {
    dataIndex: 'status',
    title: '状态',
    width: 130,
    valueType: 'enum',
    valueEnum: {
      active: { text: '活跃', status: 'success' },
      inactive: { text: '禁用', status: 'info' },
    },
    editable: {
      type: 'select',
      options: [
        { label: '活跃', value: 'active' },
        { label: '禁用', value: 'inactive' },
      ],
      placeholder: '选择状态',
    },
  },
  {
    dataIndex: 'createdAt',
    title: '创建时间',
    width: 180,
    valueType: 'dateTime',
  },
  {
    dataIndex: 'action',
    title: '操作',
    width: 220,
    fixed: 'right',
  },
]

// ---- 模拟数据 ----
const mockData = ref(
  Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `用户 ${i + 1}`,
    age: Math.floor(Math.random() * 50) + 18,
    email: `user${i + 1}@example.com`,
    status: Math.random() > 0.5 ? 'active' : 'inactive',
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  }))
)

// 数据请求函数
async function fetchData(params: RequestParams): Promise<TableData> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  let filteredData = [...mockData.value]

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
    success: true,
  }
}

// ---- 保存回调 ----

// 单元格保存
async function handleCellSave(params: EditSaveParams): Promise<boolean> {
  console.log('单元格保存:', params)
  // 模拟接口调用
  await new Promise((resolve) => setTimeout(resolve, 300))

  // 模拟更新本地数据
  const index = mockData.value.findIndex((item) => item.id === params.rowId)
  if (index !== -1 && params.dataIndex && params.value !== undefined) {
    mockData.value[index][params.dataIndex] = params.value
  }

  ElMessage.success(`已保存: ${params.dataIndex} = ${params.value}`)
  return true
}

// 整行保存
async function handleRowSave(params: EditSaveParams): Promise<boolean> {
  console.log('整行保存:', params)
  // 模拟接口调用
  await new Promise((resolve) => setTimeout(resolve, 500))

  // 模拟更新本地数据
  if (params.values) {
    const index = mockData.value.findIndex((item) => item.id === params.rowId)
    if (index !== -1) {
      Object.assign(mockData.value[index], params.values)
    }
  }

  ElMessage.success('整行保存成功')
  return true
}

// 删除
function handleDelete(row: Record<string, unknown>) {
  const index = mockData.value.findIndex((item) => item.id === row.id)
  if (index !== -1) {
    mockData.value.splice(index, 1)
    ElMessage.success(`已删除: ${row.name}`)
  }
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
  margin-top: -8px;
  margin-bottom: 16px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
