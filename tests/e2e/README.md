# E2E 测试文档

## 概述

本项目使用 [Playwright](https://playwright.dev/) 进行端到端测试，验证 ProTable 组件在真实浏览器中的行为。

## 测试环境

- **测试框架**: Playwright v1.58
- **浏览器**: Chrome, Edge (使用系统已安装的浏览器)
- **测试目录**: `tests/e2e/`
- **配置文件**: `playwright.config.ts`

## 快速开始

```bash
# 运行所有 E2E 测试
npm run test:e2e

# UI 模式（可视化调试，推荐）
npm run test:e2e:ui

# 调试模式（逐步执行）
npm run test:e2e:debug

# 查看测试报告
npm run test:e2e:report

# 运行指定浏览器
npx playwright test --project=chrome
npx playwright test --project=edge

# 运行指定测试文件
npx playwright test tests/e2e/basic.spec.ts

# 运行匹配名称的测试
npx playwright test --grep "分页"
```

## 测试用例

### 1. 基础功能测试 (`basic.spec.ts`)

测试 ProTable 的核心功能是否正常工作。

| 测试用例 | 描述 | 验证点 |
|----------|------|--------|
| 表格应该正确渲染数据行 | 验证表格加载后显示数据 | 数据行数 > 0 |
| 分页切换应该正常工作 | 测试分页组件 | 页码从 1 变为 2 |
| 排序功能应该正常工作 | 测试列排序 | 点击列头后表格正常显示 |
| 搜索功能应该正常工作 | 测试搜索过滤 | 输入关键词后表格正常显示 |

### 2. URL 状态同步测试 (`url-sync.spec.ts`)

测试表格状态与 URL 的双向同步功能。

| 测试用例 | 描述 | 验证点 |
|----------|------|--------|
| 分页变化应该同步到 URL | 分页操作更新 URL | URL 包含 `current=2` |
| 页面刷新应该还原状态 | 刷新后状态恢复 | 页码仍为 2 |
| 直接访问带参数的 URL 应该还原状态 | URL 参数初始化状态 | 页码显示为 2 |

### 3. 大数据性能测试 (`large-data.spec.ts`)

测试大数据量下的表格性能和虚拟滚动。

| 测试用例 | 描述 | 验证点 |
|----------|------|--------|
| 1万条数据应该在合理时间内加载 | 性能基准测试 | 加载时间 < 5 秒 |
| 虚拟滚动应该在大数据量时启用 | 虚拟滚动自动启用 | 显示"虚拟滚动已启用"标签 |
| 搜索过滤应该在大数据中正常工作 | 大数据搜索功能 | 表格正常显示 |

## 测试结果

### 最近测试结果

**日期**: 2026-03-23
**状态**: ✅ 全部通过

```
Running 20 tests using 4 workers

  ✓  basic.spec.ts (4 tests) - Chrome
  ✓  basic.spec.ts (4 tests) - Edge
  ✓  url-sync.spec.ts (3 tests) - Chrome
  ✓  url-sync.spec.ts (3 tests) - Edge
  ✓  large-data.spec.ts (3 tests) - Chrome
  ✓  large-data.spec.ts (3 tests) - Edge

  20 passed (56.1s)
```

### 测试覆盖

| 模块 | 测试数 | 覆盖功能 |
|------|--------|----------|
| 基础功能 | 8 | 渲染、分页、排序、搜索 |
| URL 同步 | 6 | 分页同步、状态恢复 |
| 大数据性能 | 6 | 加载性能、虚拟滚动 |
| **总计** | **20** | - |

## 目录结构

```
tests/
├── e2e/                          # Playwright E2E 测试
│   ├── basic.spec.ts             # 基础功能测试
│   ├── url-sync.spec.ts          # URL 同步测试
│   └── large-data.spec.ts        # 大数据性能测试
├── unit/                         # Vitest 单元测试
├── integration/                  # 集成测试
└── fixtures/                     # 测试数据

playwright-report/                # 测试报告输出目录
test-results/                     # 测试结果（截图、trace）
playwright.config.ts              # Playwright 配置
```

## 配置说明

### playwright.config.ts 关键配置

```typescript
{
  testDir: './tests/e2e',           // 测试目录
  fullyParallel: true,              // 并行执行
  retries: CI ? 2 : 0,              // CI 环境重试
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',        // 失败时记录 trace
    screenshot: 'only-on-failure',  // 失败时截图
  },
  projects: [
    { name: 'chrome', use: { channel: 'chrome' } },
    { name: 'edge', use: { channel: 'msedge' } },
  ],
  webServer: {
    command: 'npm run dev',         // 自动启动开发服务器
    url: 'http://localhost:3000',
  },
}
```

## 调试技巧

### 1. 使用 UI 模式

```bash
npm run test:e2e:ui
```

可以可视化地查看测试执行过程，包括：
- 测试步骤
- 页面快照
- 时间线

### 2. 使用代码生成器

```bash
npx playwright codegen http://localhost:3000
```

自动录制操作并生成测试代码。

### 3. 查看失败详情

```bash
npm run test:e2e:report
```

查看失败测试的：
- 截图
- 执行轨迹
- 错误信息

### 4. 调试单个测试

```bash
npx playwright test tests/e2e/basic.spec.ts --debug
```

逐步执行，可以检查每一步的页面状态。

## 持续集成

在 CI 环境中运行时：
- 自动重试失败的测试（2 次）
- 串行执行（1 个 worker）
- 生成 HTML 报告

```yaml
# GitHub Actions 示例
- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
```

## 最佳实践

1. **使用精确的选择器**: 优先使用 `data-testid` 或明确的 CSS 选择器
2. **等待策略**: 使用 `expect().toBeVisible()` 而非固定等待时间
3. **测试隔离**: 每个测试独立，不依赖其他测试的状态
4. **有意义的断言**: 断言用户可见的行为，而非实现细节

## 扩展阅读

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [Element Plus 组件测试](https://element-plus.org/zh-CN/guide/dev-guide.html#testing)
