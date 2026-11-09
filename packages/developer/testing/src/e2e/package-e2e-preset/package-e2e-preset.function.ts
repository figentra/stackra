/**
 * Stackra file contract:
 * Purpose: `packageE2ePreset(options)`, the Playwright config of a package's end-to-end tier: `.e2e.test.ts` files
 *          under the package root, run in parallel against the Vite app gen writes into `.stackra/e2e`, in Chromium
 *          and in Chromium with an Arabic locale (the page then renders right to left), plus Firefox and WebKit on
 *          request.
 * Boundary: pure apart from reading `CI`. Results go under `<root>/.stackra/e2e-results` and the HTML report under
 *           `<root>/.stackra/e2e-report`. The page server is `vite` run from the package on 127.0.0.1, so `vite` must
 *           resolve there.
 * Runtime: node
 * Governing contract: ADR 0022 (the 2026-11-09 amendment: package e2e); ADR 0182 (the e2e tier); ADR 0295
 *                     (decision 5).
 */
import { devices, type PlaywrightTestConfig } from "@playwright/test";

import type { PackageE2ePresetOptions } from "#e2e/package-e2e-preset/package-e2e-preset-options.type";

/** An end-to-end test file. */
const E2E_FILE = /\.e2e\.test\.ts$/;

/** The port of the page server when none is given. */
const DEFAULT_PORT = 5199;

/**
 * The Playwright config of a package.
 *
 * @example
 * export default packageE2ePreset({ root, package: "@stackra/ui" });
 */
export function packageE2ePreset(options: PackageE2ePresetOptions): PlaywrightTestConfig {
  const isCi = process.env["CI"] !== undefined;
  const port = options.port ?? DEFAULT_PORT;
  const baseURL = `http://127.0.0.1:${port}`;
  const results = `${options.root}/.stackra/e2e-results`;
  return {
    testDir: options.root,
    testMatch: E2E_FILE,
    fullyParallel: true,
    forbidOnly: isCi,
    outputDir: results,
    // The HTML reporter clears its folder, so it may not sit inside `outputDir` (Playwright refuses that).
    reporter: [
      ["list"],
      ["html", { outputFolder: `${options.root}/.stackra/e2e-report`, open: "never" }],
    ],
    use: { baseURL, trace: "retain-on-failure" },
    projects: [
      { name: "chromium", use: { ...devices["Desktop Chrome"] } },
      { name: "chromium-ar", use: { ...devices["Desktop Chrome"], locale: "ar-SA" } },
      ...(options.browsers?.includes("firefox") === true
        ? [{ name: "firefox", use: { ...devices["Desktop Firefox"] } }]
        : []),
      ...(options.browsers?.includes("webkit") === true
        ? [{ name: "webkit", use: { ...devices["Desktop Safari"] } }]
        : []),
    ],
    webServer: {
      name: options.package,
      // `--host 127.0.0.1`: `localhost` can resolve to IPv6 only, which the IPv4 `url` never reaches.
      command: `pnpm exec vite --config .stackra/e2e/vite.config.ts --host 127.0.0.1 --port ${port} --strictPort`,
      cwd: options.root,
      url: baseURL,
      reuseExistingServer: !isCi,
      // A server that never answers shows why, in the run's output.
      stdout: "pipe",
      stderr: "pipe",
    },
  };
}
