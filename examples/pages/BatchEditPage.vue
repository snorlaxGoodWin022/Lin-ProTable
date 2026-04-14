<template>
  <div class="page-container">
    <div class="info-panel">
      <h3 class="info-title">批量编辑功能</h3>
      <p class="info-desc">
        batch 批量编辑模式：通过 checkbox
        选择多行，点击"批量编辑"按钮同时进入编辑状态，修改后一次性保存所有变更。
      </p>

      <div class="test-section">
        <h4 class="test-title">测试步骤</h4>
        <ol class="test-steps">
          <li>通过 <strong>checkbox</strong> 选择多行数据</li>
          <li>点击工具栏 <strong>批量编辑</strong> 按钮（括号内显示已选行数）</li>
          <li>修改任意行的姓名、年龄、邮箱、状态等字段</li>
          <li>点击 <strong>批量保存</strong> 一次性提交所有修改</li>
          <li>或点击 <strong>取消</strong> 放弃所有修改回滚到原始值</li>
          <li>未选择任何行时，批量编辑按钮 <strong>禁用</strong></li>
        </ol>
      </div>

      <div class="note-card" style="margin-top: 16px">
        <div class="note-title">使用说明</div>
        <p class="note-text">
          batch 模式必须配合 <code>rowSelection</code>（checkbox）使用。先选择行再点击编辑，也可通过
          ref 调用 <code>startBatchEdit()</code> 方法编程式触发。
        </p>
      </div>

      <div class="warn-card">
        <div class="warn-title">回调说明</div>
        <p class="warn-text">
          通过 <code>onBatchSave</code> 回调接收批量变更数据，参数中
          <code>rows</code> 数组包含所有变更行的 rowId、原始记录和变更字段。返回 <code>true</code>
          表示保存成功并更新本地数据。
        </p>
      </div>
    </div>

    <div class="table-panel">
      <ProTable
        ref="tableRef"
        :columns="columns"
        :request="fetchData"
        row-key="id"
        edit-mode="batch"
        :row-selection="rowSelectionConfig"
        :on-batch-save="handleBatchSave"
        :pagination="{ pageSizes: [5, 10, 20] }"
        show-toolbar
        @selection-change="handleSelectionChange"
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
import type {
  ColumnProps,
  RequestParams,
  TableData,
  RowSelectionOptions,
  EditSaveParams,
} from '../../src/components/ProTable/types'

const tableRef = ref()
const currentSelectedKeys = ref<(string | number)[]>([])

const columns: ColumnProps[] = [
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
    valueType: 'digit',
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
    },
  },
  { dataIndex: 'createdAt', title: '创建时间', width: 180, valueType: 'dateTime', sorter: true },
]

// 行选择配置
const rowSelectionConfig: RowSelectionOptions = {
  type: 'checkbox',
  columnWidth: 48,
  fixed: true,
}

const mockData = ref(
  Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `用户 ${i + 1}`,
    age: Math.floor(Math.random() * 50) + 18,
    email: `user${i + 1}@example.com`,
    phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
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

function handleSelectionChange(keys: (string | number)[]) {
  currentSelectedKeys.value = keys
}

async function handleBatchSave(params: EditSaveParams): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  if (params.rows) {
    for (const { rowId, values } of params.rows) {
      const index = mockData.value.findIndex((item) => item.id === rowId)
      if (index !== -1) {
        Object.assign(mockData.value[index], values)
      }
    }
  }
  ElMessage.success(`批量保存成功，共修改 ${params.rows?.length ?? 0} 条数据`)
  return true
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

.note-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.note-text code {
  background: rgba(230, 162, 60, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
  color: #e6a23c;
}

.warn-card {
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  padding: 14px;
  margin-top: 12px;
}

.warn-title {
  font-size: 14px;
  color: #f56c6c;
  margin: 0 0 8px;
  font-weight: 600;
}

.warn-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.warn-text code {
  background: rgba(245, 108, 108, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
  color: #f56c6c;
}

.table-panel {
  flex: 1;
  padding: 20px;
  overflow: auto;
}
</style>
