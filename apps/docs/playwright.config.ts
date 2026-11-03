/**
 * Stackra file contract:
 * Purpose: Playwright config of @figentra/docs: the site's end-to-end tier (`pnpm test:e2e`), Chromium only, against
 *          the prerendered site served by `wrangler dev` with the Worker's own asset rules (`wrangler.jsonc`), so the
 *          trailing-slash handling, `_redirects` and the 404 page are the ones production serves. Suites live in
 *          `e2e/__tests__/<name>.e2e.test.ts` (ADR 0022); `pnpm test` (vitest) never runs them.
 * Boundary: test configuration only; the site must be built first (`pnpm build`), which the e2e task depends on.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); ADR 0022 (test placement); ADR 0514; STA-2026 (FR-003, FR-005).
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env["STACKRA_DOCS_E2E_PORT"] || 3343);
const isCi = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/__tests__/*.e2e.test.ts",
  fullyParallel: true,
  forbidOnly: isCi,
  // No retries: a flaky page is a failure to fix, not to hide.
  retries: 0,
  reporter: isCi ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    navigationTimeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `wrangler dev --ip 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/llms.txt`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
