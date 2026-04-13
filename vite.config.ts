import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/components/ProTable/index.ts'),
      name: 'ProTable',
      fileName: (format) => `protable.${format}.js`,
    },
    rollupOptions: {
      external: [
        'vue',
        'element-plus',
        '@element-plus/icons-vue',
        'vuedraggable-next',
        'xlsx',
        'lodash-es',
        'vue-router',
      ],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          '@element-plus/icons-vue': 'ElementPlusIconsVue',
          'vuedraggable-next': 'vuedraggableNext',
          xlsx: 'XLSX',
          'lodash-es': 'lodashEs',
          'vue-router': 'VueRouter',
        },
      },
    },
  },
})
