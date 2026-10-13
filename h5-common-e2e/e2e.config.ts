/*
 * 融合资源平台端到端测试（tester-army/e2e）。
 *
 * 【为什么是独立工程】e2e 要 Node >= 24.8，h5 的 vue-cli 4 / webpack 4 只能跑在 Node 16，
 * 依赖装在一起会互相拖累；用例也不放进业务仓库，单独维护。跑的时候用 Node 24，被测应用仍由 Node 16 起。
 * 被测 h5 工程默认在 ~/iflySpace/platform_mixresource/h5-platform-mixresource，可用 H5_DIR 覆盖。
 *
 * 【被测应用】本地已有 dev server（npm run serve，默认 8081）时直接复用；没有就按 app.command 拉起。
 * 器材流程在 dev 下走本地 mock（src/api/mock/sciencelab），数据在页面内存里，每次加载页面重置，
 * 所以每个用例天然是干净数据，不需要清理。
 *
 * 【不用模型】用例全部是确定性的（locator + expect），不写 agent.* 步骤，不声明 agents。
 * 「智能」的部分交给 Claude Code：它通过 e2e 的 MCP 服务（npx e2e mcp）观察页面、试定位器、写用例、修用例，
 * 模型调用都发生在 Claude Code 客户端里；跑测试本身不调用任何模型，也不外发页面内容。
 */
import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

const H5_DIR =
  process.env.H5_DIR ?? `${process.env.HOME}/iflySpace/platform_mixresource/h5-platform-mixresource`;
const PORT = process.env.H5_PORT ?? '8081';
const NODE16 =
  process.env.H5_NODE_BIN ?? `${process.env.HOME}/.nvm/versions/node/v16.20.2/bin/node`;

export default {
  tests: 'tests/**/*.e2e.ts',
  targets: [
    {
      name: 'chromium',
      engine: web({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' }),
      app: {
        url: `http://localhost:${PORT}`,
        command: {
          executable: NODE16,
          args: ['node_modules/@vue/cli-service/bin/vue-cli-service.js', 'serve', '--port', PORT],
          cwd: H5_DIR,
          env: { VUE_APP_LOCAL: 'test', VUE_APP_CODE: 'composition' },
          // webpack 4 冷启动编译 3000+ 模块，给足时间
          startupTimeout: 300_000,
          log: '.e2e/logs/app.log',
          // 本地开着 dev server 就直接用；CI 下 e2e 会忽略这项，总是自己拉起
          reuseExisting: true,
        },
      },
    },
  ],
  reporters: ['list', 'markdown', 'junit'],
} satisfies E2EConfig;
