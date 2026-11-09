/**
 * Stackra file contract:
 * Purpose: `test`, Playwright's `test` with the house fixtures: every test records the requests its browser context
 *          sent and got an answer to (service-worker requests included), which `apiCalls(key)` reads, and fails when
 *          the page logged a console error or threw (`consoleErrors: "allow"` in `test.use` opts a file out).
 * Boundary: the recorder is an automatic fixture on the default `context`; the log is emptied when each test starts.
 *           `failOnConsoleError` is automatic too: a render with console errors is not live. Playwright's own
 *           fixtures (`page`, `context`, `request`, `browser`, `baseURL`) are unchanged.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 6); ADR 0182 (the e2e tier).
 */
import { expect, test as base, type Request } from "@playwright/test";

import { API_CALL_LOG } from "#e2e/api-calls/api-call-log.constant";

/** Appends one finished request to `API_CALL_LOG`. */
const record = (request: Request): void => {
  API_CALL_LOG.push({
    method: request.method(),
    url: request.url(),
    headers: request.headers(),
  });
};

/** The fixtures this file adds. */
interface HouseFixtures {
  // oxlint-disable-next-line typescript/no-invalid-void-type -- reason: Playwright types a fixture that yields no value as `void`
  recordApiCalls: void;
  // oxlint-disable-next-line typescript/no-invalid-void-type -- reason: as above
  failOnConsoleError: void;
}

/** The options this file adds. */
interface HouseOptions {
  /** `fail` (the default) fails a test whose page logged a console error or threw; `allow` does not. */
  consoleErrors: "fail" | "allow";
}

/**
 * The e2e test function.
 *
 * @example
 * test("places an order", async ({ page }) => {
 *   await page.goto("/quick-order");
 * });
 */
export const test = base.extend<HouseFixtures & HouseOptions>({
  consoleErrors: ["fail", { option: true }],
  recordApiCalls: [
    async ({ context }, use) => {
      API_CALL_LOG.length = 0;
      context.on("requestfinished", record);
      await use();
      context.off("requestfinished", record);
    },
    { auto: true },
  ],
  failOnConsoleError: [
    async ({ page, consoleErrors }, use) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => {
        errors.push(error.message);
      });
      await use();
      if (consoleErrors === "fail") expect(errors, "browser console errors").toEqual([]);
    },
    { auto: true },
  ],
});
