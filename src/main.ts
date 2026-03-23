import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import App from './App.vue'
import BasicUsage from '../examples/BasicUsage.vue'
import UrlSyncDemo from '../examples/UrlSyncDemo.vue'
import LargeDataDemo from '../examples/LargeDataDemo.vue'

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/basic' },
    { path: '/basic', component: BasicUsage },
    { path: '/url-sync', component: UrlSyncDemo },
    { path: '/large-data', component: LargeDataDemo }
  ]
})

// 创建应用
const app = createApp(App)

// 使用插件
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 挂载
app.mount('#app')