/**
 * Stackra file contract:
 * Purpose: `APP_E2E`, the documented exception that keeps app e2e tests in the app.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0022 (decision 3).
 */

/** App e2e tests stay in the app (ADR 0022 d3; AGENTS.md "App e2e lives in the app"). */
export const APP_E2E = Object.freeze({
  pattern: "apps/<app>/e2e/__tests__/<name>.e2e.test.ts",
  reason: "app e2e lives in the app, a documented exception to the member test rule",
  adr: "0022",
});
