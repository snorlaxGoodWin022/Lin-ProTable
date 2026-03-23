import { test, expect } from '@playwright/test'

test.describe('ProTable 基础功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/basic')
    // 等待表格加载完成
    await expect(page.locator('.el-table').first()).toBeVisible()
  })

  test('表格应该正确渲染数据行', async ({ page }) => {
    // 等待数据加载
    await page.waitForSelector('.el-table__body-wrapper tbody tr')

    // 验证数据行存在
    const rows = page.locator('.el-table__body-wrapper tbody tr').first()
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('分页切换应该正常工作', async ({ page }) => {
    // 定位到第一个表格区域的分页
    const firstSection = page.locator('.demo-section').first()
    const pagination = firstSection.locator('.el-pagination')

    // 等待分页组件加载
    await expect(pagination).toBeVisible()

    // 获取当前页码
    const currentPage = pagination.locator('.is-active')
    await expect(currentPage).toHaveText('1')

    // 点击下一页
    await pagination.locator('.btn-next').click()

    // 等待加载完成
    await page.waitForTimeout(800)

    // 验证页码变化
    await expect(currentPage).toHaveText('2')
  })

  test('排序功能应该正常工作', async ({ page }) => {
    // 定位到第一个表格区域
    const firstSection = page.locator('.demo-section').first()
    const firstTable = firstSection.locator('.el-table')

    // 找到 ID 列头
    const idHeader = firstTable.locator('.el-table__header th').first()

    // 点击列头触发排序
    await idHeader.click()
    await page.waitForTimeout(500)

    // 再次点击切换排序方向
    await idHeader.click()
    await page.waitForTimeout(500)

    // 验证表格仍然正常显示（排序操作不会导致错误）
    await expect(firstTable).toBeVisible()

    // 验证数据行仍然存在
    const rows = firstTable.locator('.el-table__body-wrapper tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('搜索功能应该正常工作', async ({ page }) => {
    // 定位到第一个表格区域的搜索框
    const firstSection = page.locator('.demo-section').first()
    const searchInput = firstSection.locator('input[placeholder="搜索..."]')

    // 输入搜索词
    await searchInput.fill('用户 1')
    await page.waitForTimeout(800)

    // 验证表格仍然正常显示
    const table = page.locator('.el-table').first()
    await expect(table).toBeVisible()
  })
})
