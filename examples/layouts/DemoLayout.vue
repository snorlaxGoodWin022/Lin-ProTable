<template>
  <div class="demo-layout">
    <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
      <div class="sidebar-header">
        <h2 class="sidebar-title">
          <span v-if="!collapsed">ProTable</span>
          <span v-else>PT</span>
        </h2>
        <p v-if="!collapsed" class="sidebar-subtitle">功能示例</p>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="nav-item--active"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button
          class="collapse-btn"
          :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
          @click="toggleCollapse"
        >
          <el-icon :size="16">
            <component :is="collapsed ? Expand : Fold" />
          </el-icon>
        </button>
      </div>
    </aside>
    <main class="main-content" :class="{ 'main-content--expanded': collapsed }">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Fold, Expand } from '@element-plus/icons-vue'

const collapsed = ref(false)

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

const navItems = [
  { path: '/basic', icon: '📊', label: '基础表格' },
  { path: '/edit', icon: '✏️', label: '行内编辑' },
  { path: '/row-selection', icon: '☑️', label: '行选择' },
  { path: '/batch-edit', icon: '📝', label: '批量编辑' },
  { path: '/url-sync', icon: '🔗', label: 'URL 同步' },
  { path: '/large-data', icon: '🚀', label: '大数据' },
  { path: '/export', icon: '📥', label: '导出功能' },
  { path: '/column-setting', icon: '⚙️', label: '列设置' },
  { path: '/crud', icon: '🔧', label: 'CRUD' },
]
</script>

<style scoped>
.demo-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 200px;
  background: #304156;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar--collapsed {
  width: 64px;
}

.sidebar--collapsed .nav-item {
  justify-content: center;
  padding: 12px 0;
  border-left: 3px solid transparent;
}

.sidebar--collapsed .sidebar-header {
  text-align: center;
  padding: 20px 8px 16px;
}

.sidebar-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: padding 0.3s ease;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #409eff;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-subtitle {
  font-size: 12px;
  color: #bfcbd9;
  margin: 4px 0 0;
}

.sidebar-nav {
  padding: 8px 0;
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  color: #bfcbd9;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.nav-item--active {
  background: rgba(64, 158, 255, 0.15);
  color: #409eff;
  border-left-color: #409eff;
}

.nav-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: #bfcbd9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.main-content {
  margin-left: 200px;
  flex: 1;
  min-height: 100vh;
  background: #f5f7fa;
  transition: margin-left 0.3s ease;
}

.main-content--expanded {
  margin-left: 64px;
}
</style>
