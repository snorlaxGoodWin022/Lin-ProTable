import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import App from './App.vue'
import DemoLayout from '../examples/layouts/DemoLayout.vue'
import BasicTablePage from '../examples/pages/BasicTablePage.vue'
import EditTablePage from '../examples/pages/EditTablePage.vue'
import UrlSyncPage from '../examples/pages/UrlSyncPage.vue'
import LargeDataPage from '../examples/pages/LargeDataPage.vue'
import ExportPage from '../examples/pages/ExportPage.vue'
import ColumnSettingPage from '../examples/pages/ColumnSettingPage.vue'
import RowSelectionPage from '../examples/pages/RowSelectionPage.vue'
import BatchEditPage from '../examples/pages/BatchEditPage.vue'
import CrudPage from '../examples/pages/CrudPage.vue'

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: DemoLayout,
      children: [
        { path: '', redirect: '/basic' },
        { path: 'basic', component: BasicTablePage },
        { path: 'edit', component: EditTablePage },
        { path: 'url-sync', component: UrlSyncPage },
        { path: 'large-data', component: LargeDataPage },
        { path: 'export', component: ExportPage },
        { path: 'column-setting', component: ColumnSettingPage },
        { path: 'row-selection', component: RowSelectionPage },
        { path: 'batch-edit', component: BatchEditPage },
        { path: 'crud', component: CrudPage },
      ],
    },
  ],
})

// 创建应用
const app = createApp(App)

// 使用插件
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 挂载
app.mount('#app')
