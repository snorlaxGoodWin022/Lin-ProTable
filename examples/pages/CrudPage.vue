<template>
  <div class="page-container">
    <div class="info-panel">
      <h3 class="info-title">CRUD 功能</h3>
      <p class="info-desc">
        通过 <code>crud</code> 属性配置增删改查，使用 Drawer
        抽屉面板进行新增和编辑，支持单行删除和批量删除。表单字段从 columns
        自动生成，支持自定义覆盖。
      </p>

      <div class="test-section">
        <h4 class="test-title">功能测试</h4>
        <ol class="test-steps">
          <li>点击 <strong>新增</strong> 按钮打开抽屉面板</li>
          <li>填写表单后点击 <strong>确定</strong> 新增数据</li>
          <li>点击操作列 <strong>编辑</strong> 按钮修改数据</li>
          <li>点击操作列 <strong>删除</strong> 按钮删除单行</li>
          <li>勾选多行后点击 <strong>批量删除</strong></li>
          <li>验证 ID 字段编辑时禁用（disabledInEdit）</li>
          <li>验证 createdAt 字段通过自定义插槽实现</li>
        </ol>
      </div>
    </div>

    <div class="table-panel">
      <ProTable
        :columns="columns"
        :request="fetchData"
        row-key="id"
        :crud="crudConfig"
        :row-selection="{ type: 'checkbox' }"
        :pagination="{ pageSizes: [5, 10, 20] }"
        show-toolbar
      >
        <template #form-createdAt="{ formData: fd, mode }">
          <el-date-picker
            v-model="fd.createdAt"
            type="datetime"
            placeholder="选择创建时间"
            :disabled="mode === 'update'"
            style="width: 100%"
          />
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
  CrudConfig,
} from '../../src/components/ProTable/types'

const columns: ColumnProps[] = [
  { dataIndex: 'id', title: 'ID', width: 80, sorter: true, disabledInEdit: true },
  {
    dataIndex: 'name',
    title: '姓名',
    width: 150,
    formType: 'input',
    rules: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  },
  {
    dataIndex: 'age',
    title: '年龄',
    width: 100,
    formType: 'number',
    formProps: { min: 0, max: 150 },
  },
  { dataIndex: 'email', title: '邮箱', width: 220, formType: 'input' },
  {
    dataIndex: 'status',
    title: '状态',
    width: 130,
    valueType: 'enum',
    valueEnum: {
      active: { text: '活跃', status: 'success' },
      inactive: { text: '禁用', status: 'info' },
    },
    formType: 'select',
    defaultValue: 'active',
  },
  {
    dataIndex: 'createdAt',
    title: '创建时间',
    width: 180,
    valueType: 'dateTime',
    formType: 'custom',
  },
  {
    dataIndex: 'role',
    title: '角色',
    width: 120,
    hideInTable: true,
    formType: 'select',
    formProps: {
      options: [
        { label: '管理员', value: 'admin' },
        { label: '普通用户', value: 'user' },
      ],
    },
    defaultValue: 'user',
  },
]

const mockData = ref(
  Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    name: `用户 ${i + 1}`,
    age: Math.floor(Math.random() * 50) + 18,
    email: `user${i + 1}@example.com`,
    status: Math.random() > 0.5 ? 'active' : 'inactive',
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    role: Math.random() > 0.7 ? 'admin' : 'user',
  }))
)

let nextId = mockData.value.length + 1

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

const crudConfig: CrudConfig = {
  drawerWidth: 520,

  async create(values) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newItem = {
      id: nextId++,
      ...values,
      createdAt: values.createdAt || new Date().toISOString(),
    }
    mockData.value.unshift(newItem)
    ElMessage.success('新增成功')
    return true
  },

  async update(values) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const index = mockData.value.findIndex((item) => item.id === values.id)
    if (index !== -1) {
      Object.assign(mockData.value[index], values)
      ElMessage.success('编辑成功')
      return true
    }
    return false
  },

  async delete(rowId) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const index = mockData.value.findIndex((item) => item.id === rowId)
    if (index !== -1) {
      mockData.value.splice(index, 1)
      ElMessage.success('删除成功')
      return true
    }
    return false
  },

  async batchDelete(rowIds) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const idSet = new Set(rowIds)
    mockData.value = mockData.value.filter((item) => !idSet.has(item.id))
    ElMessage.success(`成功删除 ${rowIds.length} 条数据`)
    return true
  },
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

.info-desc code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #409eff;
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
