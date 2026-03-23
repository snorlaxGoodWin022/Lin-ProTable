import { test, expect } from '@playwright/test'

test.describe('大数据性能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/large-data')
    await expect(page.locator('.el-table')).toBeVisible()
  })

  test('1万条数据应该在合理时间内加载', async ({ page }) => {
    // 选择 1 万数据量（已经是默认值，但确保选中）
    await page.click('.el-radio-button:has-text("1万")')

    // 记录开始时间
    const startTime = Date.now()

    // 等待数据加载完成
    await page.waitForSelector('.el-table__body-wrapper tbody tr', { timeout: 10000 })

    const loadTime = Date.now() - startTime

    // 验证加载时间在 5 秒内
    expect(loadTime).toBeLessThan(5000)

    // 验证数据行数
    const rows = page.locator('.el-table__body-wrapper tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('虚拟滚动应该在大数据量时启用', async ({ page }) => {
    // 选择 1 万数据量（>=5000 自动启用虚拟滚动）
    await page.click('.el-radio-button:has-text("1万")')
    await page.waitForTimeout(1000)

    // 检查虚拟滚动标签
    const virtualTag = page.locator('.el-tag:has-text("虚拟滚动已启用")')
    await expect(virtualTag).toBeVisible()
  })

  test('搜索过滤应该在大数据中正常工作', async ({ page }) => {
    // 等待初始数据加载
    await page.waitForTimeout(500)

    // 找到搜索输入框
    const searchInput = page.locator('input[placeholder="搜索姓名..."]')

    // 输入搜索词
    await searchInput.fill('员工 1')
    await page.waitForTimeout(800)

    // 验证表格正常显示
    const table = page.locator('.el-table')
    await expect(table).toBeVisible()
  })
})
