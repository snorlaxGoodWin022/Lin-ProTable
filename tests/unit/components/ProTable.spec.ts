import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ElTable, ElTableColumn, ElPagination, ElMessage } from 'element-plus'
import ProTable from '../../../src/components/ProTable/ProTable.vue'
import { basicColumns, mockTableData } from '../../fixtures/mockData'
import type { ColumnProps, RequestParams, TableData } from '../../../src/components/ProTable/types'

// 模拟 element-plus 组件
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    },
  }
})

// 模拟 vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
}))

describe('ProTable - 配置化表格组件', () => {
  let mockRequest: (params: RequestParams) => Promise<TableData>

  beforeEach(() => {
    // 重置模拟函数
    vi.clearAllMocks()

    // 创建模拟请求函数
    mockRequest = vi.fn().mockImplementation((params: RequestParams) => {
      return Promise.resolve({
        data: mockTableData.slice(0, params.pageSize),
        total: mockTableData.length,
        success: true,
      })
    })
  })

  test('应该根据 JSON 配置渲染表格列', async () => {
    // 准备
    const wrapper = mount(ProTable, {
      props: {
        columns: basicColumns,
        request: mockRequest,
        showToolbar: false,
        pagination: false,
      },
      global: {
        components: {
          ElTable,
          ElTableColumn,
          ElPagination,
        },
      },
    })

    // 等待初始数据加载
    await new Promise((resolve) => setTimeout(resolve, 100))

    // 验证列被正确渲染
    const table = wrapper.findComponent(ElTable)
    expect(table.exists()).toBe(true)

    // 验证列数
    const columns = wrapper.findAllComponents(ElTableColumn)
    expect(columns).toHaveLength(basicColumns.length)

    // 验证每列的配置
    basicColumns.forEach((column, index) => {
      const columnComponent = columns[index]
      expect(columnComponent.props('prop')).toBe(column.dataIndex)
      expect(columnComponent.props('label')).toBe(column.title)
      if (column.width) {
        expect(columnComponent.props('width')).toBe(column.width)
      }
    })
  })

  test('应该处理数据请求并渲染数据', async () => {
    // 准备
    const wrapper = mount(ProTable, {
      props: {
        columns: basicColumns,
        request: mockRequest,
        showToolbar: false,
        pagination: false,
      },
      global: {
        components: {
          ElTable,
          ElTableColumn,
        },
      },
    })

    // 等待初始加载
    await new Promise((resolve) => setTimeout(resolve, 100))

    // 验证请求函数被调用
    expect(mockRequest).toHaveBeenCalledTimes(1)
    expect(mockRequest).toHaveBeenCalledWith({
      current: 1,
      pageSize: 20,
    })

    // 验证表格数据被渲染
    const table = wrapper.findComponent(ElTable)
    expect(table.props('data')).toHaveLength(20) // 第一页数据
  })

  test('应该支持分页配置', async () => {
    // 准备
    const wrapper = mount(ProTable, {
      props: {
        columns: basicColumns,
        request: mockRequest,
        showToolbar: false,
        pagination: {
          enabled: true,
          pageSizes: [10, 20, 30],
          layout: 'total, sizes, prev, pager, next',
        },
      },
      global: {
        components: {
          ElTable,
          ElTableColumn,
          ElPagination,
        },
      },
    })

    // 等待初始加载
    await new Promise((resolve) => setTimeout(resolve, 100))

    // 验证分页组件存在
    const pagination = wrapper.findComponent(ElPagination)
    expect(pagination.exists()).toBe(true)

    // 验证分页配置
    expect(pagination.props('pageSizes')).toEqual([10, 20, 30])
    expect(pagination.props('layout')).toBe('total, sizes, prev, pager, next')
    expect(pagination.props('total')).toBe(mockTableData.length)
  })

  test('应该支持工具栏显示/隐藏', async () => {
    // 测试1：显示工具栏
    const wrapperWithToolbar = mount(ProTable, {
      props: {
        columns: basicColumns,
        request: mockRequest,
        showToolbar: true,
        pagination: false,
      },
      global: {
        components: {
          ElTable,
          ElTableColumn,
        },
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(wrapperWithToolbar.find('.pro-table-toolbar').exists()).toBe(true)

    // 测试2：隐藏工具栏
    const wrapperWithoutToolbar = mount(ProTable, {
      props: {
        columns: basicColumns,
        request: mockRequest,
        showToolbar: false,
        pagination: false,
      },
      global: {
        components: {
          ElTable,
          ElTableColumn,
        },
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(wrapperWithoutToolbar.find('.pro-table-toolbar').exists()).toBe(false)
  })

  test('应该支持自定义插槽渲染', async () => {
    // 准备：创建包含自定义插槽的列配置
    const columnsWithSlot: ColumnProps[] = [
      { dataIndex: 'id', title: 'ID' },
      { dataIndex: 'name', title: '姓名' },
      { dataIndex: 'custom', title: '自定义列' },
    ]

    const wrapper = mount(ProTable, {
      props: {
        columns: columnsWithSlot,
        request: mockRequest,
        showToolbar: false,
        pagination: false,
      },
      slots: {
        // 为 custom 列提供自定义渲染
        custom:
          '<template #default="{ row }"><span class="custom-cell">自定义: {{ row.name }}</span></template>',
      },
      global: {
        components: {
          ElTable,
          ElTableColumn,
        },
      },
    })

    // 等待加载
    await new Promise((resolve) => setTimeout(resolve, 100))

    // 验证自定义插槽内容被渲染
    const customCells = wrapper.findAll('.custom-cell')
    expect(customCells.length).toBeGreaterThan(0)
    expect(customCells[0].text()).toContain('自定义:')
  })

  test('应该处理请求错误', async () => {
    // 准备：模拟请求失败
    const errorRequest = vi.fn().mockRejectedValue(new Error('网络错误'))

    mount(ProTable, {
      props: {
        columns: basicColumns,
        request: errorRequest,
        showToolbar: false,
        pagination: false,
      },
      global: {
        components: {
          ElTable,
          ElTableColumn,
        },
      },
    })

    // 等待请求完成
    await new Promise((resolve) => setTimeout(resolve, 200))

    // 验证错误消息被显示
    expect(ElMessage.error).toHaveBeenCalledWith('加载数据失败')
  })

  test('应该暴露组件方法', async () => {
    // 准备
    const wrapper = mount(ProTable, {
      props: {
        columns: basicColumns,
        request: mockRequest,
        showToolbar: false,
        pagination: false,
      },
      global: {
        components: {
          ElTable,
          ElTableColumn,
        },
      },
    })

    // 等待加载
    await new Promise((resolve) => setTimeout(resolve, 100))

    // 获取组件实例
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 组件实例无法通过类型获取 exposed 方法
    const vm = wrapper.vm as any

    // 验证暴露的方法存在
    expect(typeof vm.refresh).toBe('function')
    expect(typeof vm.fetchData).toBe('function')
    expect(typeof vm.getTableData).toBe('function')
    expect(typeof vm.getTableState).toBe('function')
    expect(typeof vm.resetTableState).toBe('function')

    // 测试刷新方法
    const initialCallCount = mockRequest.mock.calls.length
    vm.refresh()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(mockRequest).toHaveBeenCalledTimes(initialCallCount + 1)

    // 测试获取表格数据
    const tableData = vm.getTableData()
    expect(Array.isArray(tableData)).toBe(true)

    // 测试获取表格状态
    const tableState = vm.getTableState()
    expect(tableState).toHaveProperty('current')
    expect(tableState).toHaveProperty('pageSize')
  })

  test('应该响应分页变化', async () => {
    // 准备
    const wrapper = mount(ProTable, {
      props: {
        columns: basicColumns,
        request: mockRequest,
        showToolbar: false,
        pagination: true,
      },
      global: {
        components: {
          ElTable,
          ElTableColumn,
          ElPagination,
        },
      },
    })

    // 等待初始加载
    await new Promise((resolve) => setTimeout(resolve, 100))

    // 模拟分页变化
    const pagination = wrapper.findComponent(ElPagination)
    await pagination.vm.$emit('current-change', 2)

    // 验证请求被调用且参数正确
    expect(mockRequest).toHaveBeenCalledWith({
      current: 2,
      pageSize: 20,
    })
  })

  test('应该处理虚拟滚动配置', async () => {
    // 准备：启用虚拟滚动
    const wrapper = mount(ProTable, {
      props: {
        columns: basicColumns,
        request: mockRequest,
        showToolbar: false,
        pagination: false,
        virtualScroll: {
          enabled: true,
          estimatedRowHeight: 60,
        },
      },
      global: {
        components: {
          ElTable,
          ElTableColumn,
        },
        stubs: {
          ProVirtualTable: true, // 存根虚拟表格组件
        },
      },
    })

    // 等待加载
    await new Promise((resolve) => setTimeout(resolve, 100))

    // 验证虚拟滚动配置被传递
    expect(wrapper.props('virtualScroll')).toEqual({
      enabled: true,
      estimatedRowHeight: 60,
    })
  })
})
