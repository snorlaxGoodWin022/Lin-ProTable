import * as XLSX from 'xlsx'
import type { ColumnProps, ExportOptions } from '../types'

/**
 * 导出表格数据为 Excel
 */
export function exportToExcel(
  columns: ColumnProps[],
  data: Record<string, unknown>[],
  filename: string = 'export.xlsx',
  options: ExportOptions = {}
): void {
  // 过滤隐藏列
  const exportColumns = columns.filter((col) => !col.hideInExport)

  // 构建表头
  const headers = exportColumns.map((col) => col.title)

  // 构建数据行
  const rows = data.map((record) => {
    return exportColumns.map((col) => {
      let value = record[col.dataIndex]

      // 使用自定义渲染或格式化函数
      if (col.customRender) {
        value = extractText(col.customRender({ text: value, record }))
      } else if (col.formatter) {
        value = col.formatter(value, record, -1)
      } else if (col.valueType) {
        value = formatValueByType(value, col.valueType, col.valueEnum)
      }

      return value ?? ''
    })
  })

  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // 设置列宽
  const colWidths = exportColumns.map((col) => ({
    wch: col.width ? Math.min(Math.max(col.width / 7, 10), 50) : 15,
  }))
  worksheet['!cols'] = colWidths

  // 设置标题行样式
  const headerRange = XLSX.utils.decode_range(worksheet['!ref']!)
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!worksheet[cellAddress]) continue

    worksheet[cellAddress].s = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'f0f0f0' } },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      },
    }
  }

  // 设置数据行样式
  for (let row = 1; row <= rows.length; row++) {
    for (let col = 0; col < exportColumns.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (!worksheet[cellAddress]) continue

      const column = exportColumns[col]

      // 数字列右对齐
      if (
        column.valueType === 'digit' ||
        column.valueType === 'money' ||
        column.valueType === 'percent'
      ) {
        worksheet[cellAddress].s = {
          ...worksheet[cellAddress].s,
          alignment: { horizontal: 'right' },
        }
      }
    }
  }

  // 创建工作簿
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1')

  // 导出文件
  XLSX.writeFile(workbook, filename)
}

/**
 * 导出为 CSV
 */
export function exportToCsv(
  columns: ColumnProps[],
  data: Record<string, unknown>[],
  filename: string = 'export.csv'
): void {
  const exportColumns = columns.filter((col) => !col.hideInExport)

  // 构建 CSV 行
  const rows = []

  // 表头行
  const headerRow = exportColumns.map((col) => escapeCsvValue(col.title))
  rows.push(headerRow.join(','))

  // 数据行
  data.forEach((record) => {
    const dataRow = exportColumns.map((col) => {
      let value = record[col.dataIndex]

      if (col.customRender) {
        value = extractText(col.customRender({ text: value, record }))
      } else if (col.formatter) {
        value = col.formatter(value, record, -1)
      } else if (col.valueType) {
        value = formatValueByType(value, col.valueType, col.valueEnum, true)
      }

      return escapeCsvValue(value)
    })
    rows.push(dataRow.join(','))
  })

  // 创建 Blob 并下载
  const csvContent = rows.join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * 从 VNode 或渲染结果提取纯文本
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- VNode 结构为动态类型，无法精确定义
function extractText(renderResult: any): string {
  if (renderResult == null) return ''

  // 字符串或数字
  if (typeof renderResult === 'string') return renderResult
  if (typeof renderResult === 'number') return String(renderResult)

  // 数组
  if (Array.isArray(renderResult)) {
    return renderResult.map(extractText).join('')
  }

  // 对象（可能是 VNode）
  if (typeof renderResult === 'object') {
    // 如果是 Element Plus 的 Tag 组件，尝试提取文本
    if (renderResult.type && renderResult.type.name === 'ElTag') {
      return renderResult.children || ''
    }

    // 如果有 children 属性
    if (renderResult.children) {
      if (typeof renderResult.children === 'string') return renderResult.children
      if (Array.isArray(renderResult.children)) {
        return renderResult.children.map(extractText).join('')
      }
    }

    // 如果有 text 属性
    if (renderResult.text) return renderResult.text

    // 默认返回空字符串
    return ''
  }

  return String(renderResult)
}

/**
 * 根据类型格式化值
 */
function formatValueByType(
  value: unknown,
  valueType: string,
  valueEnum?: Record<string, unknown>,
  _forCsv: boolean = false
): string {
  if (value == null) return ''

  switch (valueType) {
    case 'date':
      return new Date(value).toLocaleDateString('zh-CN')

    case 'dateTime':
      return new Date(value).toLocaleString('zh-CN')

    case 'money':
      return `¥${Number(value).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`

    case 'percent':
      return `${(Number(value) * 100).toFixed(2)}%`

    case 'enum': {
      const enumKey = String(value)
      const enumItem = valueEnum?.[enumKey] as { text?: string } | undefined
      if (enumItem?.text) return enumItem.text
      return String(value)
    }

    case 'digit':
      return Number(value).toLocaleString('zh-CN')

    default:
      return String(value)
  }
}

/**
 * 转义 CSV 值
 */
function escapeCsvValue(value: unknown): string {
  if (value == null) return ''

  const stringValue = String(value)

  // 如果包含逗号、换行符或双引号，需要用双引号包裹并转义内部的双引号
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}
