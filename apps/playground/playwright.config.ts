/**
 * Stackra file contract:
 * Purpose: Playwright config of @figentra/playground: the app's end-to-end tier (`pnpm test:e2e`), Chromium only,
 *          against the production build served by `vite preview` on the app's port. Suites live in
 *          `e2e/__tests__/<name>.e2e.test.ts` (ADR 0022 d3); `pnpm test` (vitest) never runs them.
 * Boundary: test configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = 3710;
const isCi = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/__tests__/*.e2e.test.ts",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm preview",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
