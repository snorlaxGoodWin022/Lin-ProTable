import { test, expect } from '@playwright/test'

test.describe('URL 状态同步', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/url-sync')
    await expect(page.locator('.el-table')).toBeVisible()
  })

  test('分页变化应该同步到 URL', async ({ page }) => {
    const pagination = page.locator('.el-pagination')

    // 点击下一页
    await pagination.locator('.btn-next').click()
    await page.waitForTimeout(800)

    // 验证 URL 参数
    expect(page.url()).toContain('current=2')
  })

  test('页面刷新应该还原状态', async ({ page }) => {
    // 先进行分页操作
    await page.locator('.el-pagination .btn-next').click()
    await page.waitForTimeout(800)

    // 刷新页面
    await page.reload()
    await expect(page.locator('.el-table')).toBeVisible()
    await page.waitForTimeout(800)

    // 验证分页状态恢复
    const currentPage = page.locator('.el-pagination .is-active')
    await expect(currentPage).toHaveText('2')
  })

  test('直接访问带参数的 URL 应该还原状态', async ({ page }) => {
    // 直接访问带分页参数的 URL
    await page.goto('/url-sync?current=2&pageSize=10')
    await expect(page.locator('.el-table')).toBeVisible()
    await page.waitForTimeout(800)

    // 验证分页状态
    const currentPage = page.locator('.el-pagination .is-active')
    await expect(currentPage).toHaveText('2')
  })
})
