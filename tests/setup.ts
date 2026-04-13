import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// 模拟 element-plus 组件
const mockComponent = (name: string) => ({
  name,
  template: `<div data-testid="${name}"><slot /></div>`,
  props: Object.keys(config.global.components[name]?.props || {}),
})

// 配置全局组件
config.global.components = {
  // Element Plus 组件
  ElTable: mockComponent('ElTable'),
  ElTableColumn: mockComponent('ElTableColumn'),
  ElPagination: mockComponent('ElPagination'),
  ElInput: mockComponent('ElInput'),
  ElButton: mockComponent('ElButton'),
  ElSpace: mockComponent('ElSpace'),
  ElTag: mockComponent('ElTag'),
  ElIcon: mockComponent('ElIcon'),
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}

// 模拟 vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
}))
