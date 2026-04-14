<template>
  <div class="page-container">
    <div class="info-panel">
      <h3 class="info-title">行内编辑功能</h3>
      <p class="info-desc">
        支持两种编辑模式：cell 单元格编辑（点击即编辑）和 row
        整行编辑（编辑按钮触发），支持多种输入类型和校验规则。
      </p>

      <div class="test-section">
        <h4 class="test-title">Cell 模式测试</h4>
        <ol class="test-steps">
          <li>点击姓名/邮箱/年龄单元格进入编辑</li>
          <li>按 <strong>Enter</strong> 保存，<strong>Esc</strong> 取消</li>
          <li>点击状态列的下拉选择框</li>
          <li>点击其他单元格自动保存上一个</li>
        </ol>
      </div>

      <div class="test-section" style="margin-top: 16px">
        <h4 class="test-title">Row 模式测试</h4>
        <ol class="test-steps">
          <li>点击操作列 <strong>编辑</strong> 按钮</li>
          <li>同时修改姓名、年龄、邮箱等多个字段</li>
          <li>点击 <strong>保存</strong> 提交或 <strong>取消</strong> 回滚</li>
          <li>点击 <strong>删除</strong> 按钮移除数据行</li>
        </ol>
      </div>
    </div>

    <div class="table-panel">
      <h4 class="section-label">单元格编辑 (cell 模式)</h4>
      <ProTable
        :columns="cellEditColumns"
        :request="fetchData"
        row-key="id"
        edit-mode="cell"
        :on-save="handleCellSave"
        :pagination="{ pageSizes: [5, 10, 20] }"
        show-toolbar
      />

      <h4 class="section-label" style="margin-top: 24px">整行编辑 (row 模式)</h4>
      <ProTable
        :columns="rowEditColumns"
        :request="fetchData"
        row-key="id"
        edit-mode="row"
        :on-save="handleRowSave"
        :pagination="{ pageSizes: [5, 10, 20] }"
        show-toolbar
      >
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
import ProTable from '../../src/components/ProTable/ProTable.vue'
import type {
  ColumnProps,
  RequestParams,
  TableData,
  EditSaveParams,
} from '../../src/components/ProTable/types'

const cellEditColumns: ColumnProps[] = [
  { dataIndex: 'id', title: 'ID', width: 80, sorter: true },
  {
    dataIndex: 'name',
    title: '姓名',
    width: 150,
    editable: { type: 'input', placeholder: '请输入姓名' },
  },
  {
    dataIndex: 'age',
    title: '年龄',
    width: 120,
    editable: { type: 'number', props: { min: 0, max: 150 } },
  },
  {
    dataIndex: 'email',
    title: '邮箱',
    width: 220,
    editable: { type: 'input', placeholder: '请输入邮箱' },
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
  { dataIndex: 'createdAt', title: '创建时间', width: 180, valueType: 'dateTime', sorter: true },
]

const rowEditColumns: ColumnProps[] = [
  { dataIndex: 'id', title: 'ID', width: 80 },
  {
    dataIndex: 'name',
    title: '姓名',
    width: 150,
    editable: { type: 'input', placeholder: '请输入姓名' },
  },
  {
    dataIndex: 'age',
    title: '年龄',
    width: 120,
    editable: { type: 'number', props: { min: 0, max: 150 } },
  },
  {
    dataIndex: 'email',
    title: '邮箱',
    width: 220,
    editable: { type: 'input', placeholder: '请输入邮箱' },
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
  { dataIndex: 'createdAt', title: '创建时间', width: 180, valueType: 'dateTime' },
  { dataIndex: 'action', title: '操作', width: 220, fixed: 'right' },
]

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

async function fetchData(params: RequestParams): Promise<TableData> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  let filteredData = [...mockData.value]

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

async function handleCellSave(params: EditSaveParams): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const index = mockData.value.findIndex((item) => item.id === params.rowId)
  if (index !== -1 && params.dataIndex && params.value !== undefined) {
    mockData.value[index][params.dataIndex] = params.value
  }

  ElMessage.success(`已保存: ${params.dataIndex} = ${params.value}`)
  return true
}

async function handleRowSave(params: EditSaveParams): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (params.values) {
    const index = mockData.value.findIndex((item) => item.id === params.rowId)
    if (index !== -1) {
      Object.assign(mockData.value[index], params.values)
    }
  }

  ElMessage.success('整行保存成功')
  return true
}

function handleDelete(row: Record<string, unknown>) {
  const index = mockData.value.findIndex((item) => item.id === row.id)
  if (index !== -1) {
    mockData.value.splice(index, 1)
    ElMessage.success(`已删除: ${row.name}`)
  }
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

.section-label {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}
</style>
