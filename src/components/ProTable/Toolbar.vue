<template>
  <div class="pro-table-toolbar">
    <div class="toolbar-left">
      <slot name="toolbar-left" />
    </div>

    <div class="toolbar-right">
      <el-space>
        <!-- 刷新按钮 -->
        <el-tooltip content="刷新">
          <el-button
            :loading="loading"
            :icon="Refresh"
            @click="handleRefresh"
          />
        </el-tooltip>

        <!-- 列设置 -->
        <el-tooltip content="列设置">
          <el-dropdown @command="handleColumnCommand">
            <el-button :icon="Setting" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="column-setting">
                  <el-icon><Operation /></el-icon>
                  列设置
                </el-dropdown-item>
                <el-dropdown-item command="reset-columns">
                  <el-icon><Refresh /></el-icon>
                  重置列
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-tooltip>

        <!-- 导出 -->
        <el-tooltip content="导出">
          <el-button
            :icon="Download"
            @click="handleExport"
          />
        </el-tooltip>

        <!-- 自定义工具栏右侧内容 -->
        <slot name="toolbar-right" />
      </el-space>
    </div>

    <!-- 列设置弹窗 -->
    <el-dialog
      v-model="showColumnDialog"
      title="列设置"
      width="400px"
      draggable
      :close-on-click-modal="false"
    >
      <ColumnSetting
        ref="columnSettingRef"
        :columns="columns"
        :column-state="columnState"
        @update:column-state="handleColumnStateChange"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button
            type="primary"
            :loading="applying"
            @click="handleConfirm"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Refresh, Setting, Download, Operation } from '@element-plus/icons-vue'
import ColumnSetting from './ColumnSetting.vue'
import type { ColumnProps, ColumnState } from './types'

interface Props {
  loading?: boolean
  columns: ColumnProps[]
  columnState: ColumnState
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'export'): void
  (e: 'update:column-state', state: ColumnState): void
}>()

const showColumnDialog = ref(false)
const applying = ref(false)
const columnSettingRef = ref()

function handleRefresh() {
  emit('refresh')
}

function handleExport() {
  emit('export')
}

function handleColumnCommand(command: string) {
  switch (command) {
    case 'column-setting':
      showColumnDialog.value = true
      break
    case 'reset-columns':
      emit('update:column-state', {
        order: props.columns.map(col => col.dataIndex),
        visible: props.columns.reduce((acc, col) => {
          acc[col.dataIndex] = !col.hideInTable
          return acc
        }, {} as Record<string, boolean>)
      })
      break
  }
}

function handleColumnStateChange(state: ColumnState) {
  emit('update:column-state', state)
}

function handleCancel() {
  showColumnDialog.value = false
}

async function handleConfirm() {
  applying.value = true
  
  try {
    // 调用 ColumnSetting 的 applyChanges 方法
    if (columnSettingRef.value && columnSettingRef.value.applyChanges) {
      columnSettingRef.value.applyChanges()
    }
    
    // 模拟加载延迟（实际应用中可能需要等待表格重新渲染）
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 关闭弹窗
    showColumnDialog.value = false
  } catch (error) {
    console.error('应用列设置失败:', error)
  } finally {
    applying.value = false
  }
}
</script>

<style scoped>
.pro-table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-left {
  flex: 1;
}
</style>
