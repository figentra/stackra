/**
 * Stackra file contract:
 * Purpose: Playwright config of @figentra/playground: the app's end-to-end tier (`pnpm test:e2e`), Chromium only,
 *          against the production build served by `vite preview` on the app's port (`STACKRA_PLAYGROUND_PORT` picks
 *          another, to leave a running dev server alone). Suites live in
 *          `e2e/__tests__/<name>.e2e.test.ts` (ADR 0022 d3); `pnpm test` (vitest) never runs them.
 * Boundary: test configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env["STACKRA_PLAYGROUND_PORT"] || 3710);
const isCi = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/__tests__/*.e2e.test.ts",
  fullyParallel: true,
  forbidOnly: isCi,
  // No retries: a flaky route is a failure to fix, not to hide.
  retries: 0,
  reporter: isCi ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    navigationTimeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // vite itself, not through pnpm: Playwright stops the server it started, and a pnpm wrapper leaves vite running.
    // The tests start only once the URL answers, so a cold server is waited for, not retried.
    // NODE_ENV is set for the build: mise.toml exports "development" to every `mise exec`, which would otherwise make
    // this a development build, with the dev JSX runtime and the stack traces that the tests say a production build hides.
    command: `NODE_ENV=production vite build && vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
