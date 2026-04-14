<template>
  <div class="page-container">
    <div class="info-panel">
      <h3 class="info-title">列设置功能</h3>
      <p class="info-desc">
        通过工具栏的列设置按钮打开配置面板，支持列的显隐控制和拖拽排序。隐藏的列不显示但数据仍保留，拖拽可调整列顺序。
      </p>

      <div class="test-section">
        <h4 class="test-title">测试步骤</h4>
        <ol class="test-steps">
          <li>点击工具栏右侧 <strong>齿轮图标</strong> 打开列设置</li>
          <li>取消勾选某列，点击确定，验证列消失</li>
          <li>重新打开列设置，勾选回来，点击确定</li>
          <li>拖拽列项上下移动调整顺序，点击确定</li>
          <li>点击 <strong>重置</strong> 恢复默认列状态</li>
          <li>点击 <strong>全选/全不选</strong> 批量操作</li>
          <li>点击齿轮下拉菜单中的 <strong>重置列</strong> 快速重置</li>
        </ol>
      </div>

      <div class="note-card">
        <div class="note-title">列配置说明</div>
        <ul class="note-list">
          <li>隐藏列数据仍保留在数据源中</li>
          <li>拖拽排序实时生效</li>
          <li>列设置状态在页面刷新后重置</li>
          <li>可配合 URL 同步持久化列状态</li>
        </ul>
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
import { ElMessage } from 'element-plus'
import ProTable from '../../src/components/ProTable/ProTable.vue'
import type { ColumnProps, RequestParams, TableData } from '../../src/components/ProTable/types'

const columns: ColumnProps[] = [
  { dataIndex: 'id', title: 'ID', width: 80, sorter: true },
  { dataIndex: 'name', title: '姓名', width: 150, sorter: true, copyable: true },
  { dataIndex: 'age', title: '年龄', width: 100, valueType: 'digit', sorter: true },
  { dataIndex: 'email', title: '邮箱', width: 200, ellipsis: true },
  { dataIndex: 'phone', title: '电话', width: 150 },
  { dataIndex: 'address', title: '地址', width: 200, ellipsis: true },
  {
    dataIndex: 'status',
    title: '状态',
    width: 100,
    valueType: 'enum',
    valueEnum: {
      active: { text: '活跃', status: 'success' },
      inactive: { text: '禁用', status: 'info' },
    },
  },
  { dataIndex: 'createdAt', title: '创建时间', width: 180, valueType: 'dateTime', sorter: true },
  { dataIndex: 'action', title: '操作', width: 180, fixed: 'right' },
]

const mockData = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `用户 ${i + 1}`,
  age: Math.floor(Math.random() * 50) + 18,
  email: `user${i + 1}@example.com`,
  phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
  address: `某市某区某街道 ${i + 1} 号`,
  status: Math.random() > 0.5 ? 'active' : 'inactive',
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
}))

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
</style>
