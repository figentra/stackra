/**
 * Stackra file contract:
 * Purpose: `test`, Playwright's `test` with the house fixture: every test records the requests its browser context
 *          sent and got an answer to (service-worker requests included), which `apiCalls(key)` reads.
 * Boundary: the recorder is an automatic fixture on the default `context`; the log is emptied when each test starts.
 *           Playwright's own fixtures (`page`, `context`, `request`, `browser`, `baseURL`) are unchanged.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 6); ADR 0182 (the e2e tier).
 */
import { test as base, type Request } from "@playwright/test";

import { API_CALL_LOG } from "#e2e/api-calls/api-call-log.constant";

/** Appends one finished request to `API_CALL_LOG`. */
const record = (request: Request): void => {
  API_CALL_LOG.push({
    method: request.method(),
    url: request.url(),
    headers: request.headers(),
  });
};

/**
 * The e2e test function.
 *
 * @example
 * test("places an order", async ({ page }) => {
 *   await page.goto("/quick-order");
 * });
 */
export const test = base.extend<{ recordApiCalls: void }>({
  recordApiCalls: [
    async ({ context }, use) => {
      API_CALL_LOG.length = 0;
      context.on("requestfinished", record);
      await use();
      context.off("requestfinished", record);
    },
    { auto: true },
  ],
});
