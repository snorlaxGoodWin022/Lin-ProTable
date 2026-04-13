import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // 测试目录
  testDir: './tests/e2e',

  // 完全并行运行测试
  fullyParallel: true,

  // CI 上失败时禁止 test.only
  forbidOnly: !!process.env.CI,

  // CI 上重试失败测试
  retries: process.env.CI ? 2 : 0,

  // 并行工作进程数
  workers: process.env.CI ? 1 : undefined,

  // Reporter 配置
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  // 全局配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',

    // 收集失败测试的 trace
    trace: 'on-first-retry',

    // 截图
    screenshot: 'only-on-failure',

    // 操作超时
    actionTimeout: 10000,

    // 导航超时
    navigationTimeout: 30000,
  },

  // 配置项目（使用系统已安装的浏览器）
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome', // 使用系统安装的 Google Chrome
      },
    },
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge', // 使用系统安装的 Microsoft Edge
      },
    },
  ],

  // 启动开发服务器
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
