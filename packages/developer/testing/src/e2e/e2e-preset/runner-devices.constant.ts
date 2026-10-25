/**
 * Stackra file contract:
 * Purpose: `RUNNER_DEVICES`, the runner names an e2e config may use and the Playwright device each one emulates.
 * Boundary: internal to `./e2e` (not exported); data only. A name outside it is refused by `e2ePreset`.
 * Runtime: node (Playwright)
 * Governing contract: ADR 0269 (decision 6); ADR 0182 (the device matrix).
 */

/**
 * Runner name → Playwright device descriptor name.
 *
 * @example
 * devices[RUNNER_DEVICES["mobile-safari"]];
 */
export const RUNNER_DEVICES: Readonly<Record<string, string>> = Object.freeze({
  chromium: "Desktop Chrome",
  firefox: "Desktop Firefox",
  webkit: "Desktop Safari",
  "mobile-chrome": "Pixel 7",
  "mobile-safari": "iPhone 15",
});
