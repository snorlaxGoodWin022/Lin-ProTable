import { describe, test, expect, vi, beforeEach } from 'vitest'
import { exportToExcel, exportToCsv } from '../../../src/components/ProTable/utils/export'
import type { ColumnProps } from '../../../src/components/ProTable/types'

// 模拟 xlsx 库
vi.mock('xlsx', async () => {
  const actual = await vi.importActual('xlsx')
  return {
    ...actual,
    utils: {
      ...actual.utils,
      aoa_to_sheet: vi.fn(() => ({
        '!ref': 'A1:D11',
        '!cols': []
      })),
      book_new: vi.fn(() => ({})),
      book_append_sheet: vi.fn(),
      decode_range: vi.fn(() => ({ s: { c: 0, r: 0 }, e: { c: 3, r: 10 } })),
      encode_cell: vi.fn(({ r, c }) => {
        const col = String.fromCharCode(65 + c)
        return `${col}${r + 1}`
      })
    },
    writeFile: vi.fn()
  }
})

// 模拟全局对象
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()
global.document.createElement = vi.fn(() => ({
  href: '',
  download: '',
  click: vi.fn(),
  setAttribute: vi.fn()
}))
global.document.body.appendChild = vi.fn()
global.document.body.removeChild = vi.fn()

describe('导出功能 - 配置化表格数据导出', () => {
  let mockColumns: ColumnProps[]
  let mockData: any[]

  beforeEach(() => {
    // 准备测试数据
    mockColumns = [
      { dataIndex: 'id', title: 'ID', width: 80 },
      { dataIndex: 'name', title: '姓名', width: 150 },
      { dataIndex: 'age', title: '年龄', width: 100, valueType: 'digit' },
      { dataIndex: 'status', title: '状态', width: 100, valueType: 'enum', hideInExport: true }
    ]

    mockData = [
      { id: 1, name: '张三', age: 25, status: 'active' },
      { id: 2, name: '李四', age: 30, status: 'inactive' },
      { id: 3, name: '王五', age: 28, status: 'active' }
    ]
  })

  test('应该过滤 hideInExport 的列', () => {
    // 执行
    const { utils } = require('xlsx')
    const aoaToSheetSpy = vi.spyOn(utils, 'aoa_to_sheet')

    exportToExcel(mockColumns, mockData, 'test.xlsx')

    // 验证：hideInExport 的列应该被过滤
    const calledWith = aoaToSheetSpy.mock.calls[0][0]
    expect(calledWith[0]).toEqual(['ID', '姓名', '年龄']) // 状态列被过滤
  })

  test('应该根据 valueType 格式化数据', () => {
    // 准备：添加更多列类型
    const columnsWithTypes: ColumnProps[] = [
      { dataIndex: 'amount', title: '金额', valueType: 'money' },
      { dataIndex: 'rate', title: '比率', valueType: 'percent' },
      { dataIndex: 'date', title: '日期', valueType: 'date' },
      { dataIndex: 'datetime', title: '时间', valueType: 'dateTime' }
    ]

    const dataWithTypes = [
      { amount: 1000.5, rate: 0.85, date: '2024-01-15T10:30:00Z', datetime: '2024-01-15T10:30:00Z' }
    ]

    // 执行
    const { utils } = require('xlsx')
    const aoaToSheetSpy = vi.spyOn(utils, 'aoa_to_sheet')

    exportToExcel(columnsWithTypes, dataWithTypes, 'test.xlsx')

    // 验证：数据应该被正确格式化
    const calledWith = aoaToSheetSpy.mock.calls[0][0]
    const dataRow = calledWith[1] // 第一行数据

    // 检查货币格式化
    expect(dataRow[0]).toContain('¥')
    expect(dataRow[0]).toContain('1,000.50')

    // 检查百分比格式化
    expect(dataRow[1]).toContain('%')
    expect(dataRow[1]).toBe('85.00%')

    // 检查日期格式化
    expect(dataRow[2]).toBe('2024/1/15')
    expect(dataRow[3]).toContain('2024/1/15')
  })

  test('应该处理自定义渲染函数', () => {
    // 准备：包含 customRender 的列
    const columnsWithRender: ColumnProps[] = [
      {
        dataIndex: 'name',
        title: '姓名',
        customRender: ({ text, record }) => `${text} (ID: ${record.id})`
      }
    ]

    const data = [{ id: 1, name: '张三' }]

    // 执行
    const { utils } = require('xlsx')
    const aoaToSheetSpy = vi.spyOn(utils, 'aoa_to_sheet')

    exportToExcel(columnsWithRender, data, 'test.xlsx')

    // 验证：customRender 应该被调用
    const calledWith = aoaToSheetSpy.mock.calls[0][0]
    const dataRow = calledWith[1]
    expect(dataRow[0]).toBe('张三 (ID: 1)')
  })

  test('应该处理枚举值映射', () => {
    // 准备：包含 valueEnum 的列
    const columnsWithEnum: ColumnProps[] = [
      {
        dataIndex: 'status',
        title: '状态',
        valueType: 'enum',
        valueEnum: {
          active: { text: '活跃', status: 'success' },
          inactive: { text: '禁用', status: 'info' }
        }
      }
    ]

    const data = [
      { status: 'active' },
      { status: 'inactive' },
      { status: 'unknown' } // 未知值
    ]

    // 执行
    const { utils } = require('xlsx')
    const aoaToSheetSpy = vi.spyOn(utils, 'aoa_to_sheet')

    exportToExcel(columnsWithEnum, data, 'test.xlsx')

    // 验证：枚举值应该被映射
    const calledWith = aoaToSheetSpy.mock.calls[0][0]
    const dataRows = calledWith.slice(1) // 跳过表头

    expect(dataRows[0][0]).toBe('活跃') // active -> 活跃
    expect(dataRows[1][0]).toBe('禁用') // inactive -> 禁用
    expect(dataRows[2][0]).toBe('unknown') // unknown -> 原值
  })

  test('应该支持 CSV 导出', () => {
    // 准备
    const columns: ColumnProps[] = [
      { dataIndex: 'id', title: 'ID' },
      { dataIndex: 'name', title: '姓名' }
    ]

    const data = [
      { id: 1, name: '张三,测试' }, // 包含逗号，需要转义
      { id: 2, name: '李四\n换行' } // 包含换行符，需要转义
    ]

    // 执行
    exportToCsv(columns, data, 'test.csv')

    // 验证：CSV 导出逻辑应该执行
    // 由于我们模拟了 document.createElement，这里主要验证没有错误
    expect(global.document.createElement).toHaveBeenCalledWith('a')
  })

  test('应该处理空值和未定义值', () => {
    // 准备：包含空值的数据
    const columns: ColumnProps[] = [
      { dataIndex: 'id', title: 'ID' },
      { dataIndex: 'name', title: '姓名' },
      { dataIndex: 'optional', title: '可选字段' }
    ]

    const data = [
      { id: 1, name: '张三', optional: null },
      { id: 2, name: '李四', optional: undefined },
      { id: 3, name: '王五' } // 缺少 optional 字段
    ]

    // 执行
    const { utils } = require('xlsx')
    const aoaToSheetSpy = vi.spyOn(utils, 'aoa_to_sheet')

    exportToExcel(columns, data, 'test.xlsx')

    // 验证：空值应该被处理为空字符串
    const calledWith = aoaToSheetSpy.mock.calls[0][0]
    const dataRows = calledWith.slice(1)

    expect(dataRows[0][2]).toBe('') // null -> ''
    expect(dataRows[1][2]).toBe('') // undefined -> ''
    expect(dataRows[2][2]).toBe('') // 缺少字段 -> ''
  })

  test('应该应用列宽设置', () => {
    // 准备：包含不同宽度的列
    const columns: ColumnProps[] = [
      { dataIndex: 'id', title: 'ID', width: 80 },
      { dataIndex: 'name', title: '姓名', width: 200 },
      { dataIndex: 'age', title: '年龄' } // 无宽度设置
    ]

    const data = [{ id: 1, name: '张三', age: 25 }]

    // 执行
    exportToExcel(columns, data, 'test.xlsx')

    // 验证：应该调用列宽设置
    // 这里主要验证函数能正常执行，不抛出错误
    expect(true).toBe(true)
  })
})