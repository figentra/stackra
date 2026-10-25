/**
 * Stackra file contract:
 * Purpose: `e2ePreset(options)`, the Playwright config of an app's end-to-end tier: `.e2e.test.ts` files under the
 *          member root, one worker (the stack is shared and seeds reset it), the app's origin, one project per runner
 *          or RTL locale plus the `pwa` and `desktop` projects, and the stack started with `stackra dev` in e2e mode.
 * Boundary: pure apart from reading `CI`. The stack reads its inputs from the server's environment: `STACKRA_E2E=1`
 *           (serve the control routes of `E2E_CONTROL`), `STACKRA_E2E_SERVICES` and `STACKRA_E2E_SEEDS` (comma
 *           lists), `STACKRA_E2E_TURNSTILE`. A project with `match` owns its files; the others skip them.
 * Runtime: node (Playwright)
 * Governing contract: ADR 0269 (decision 6); ADR 0182 (the e2e tier); ADR 0295 (decision 5); ADR 0255 (PWA).
 */
import { devices, type PlaywrightTestConfig } from "@playwright/test";

import type { E2ePresetOptions } from "#e2e/e2e-preset/e2e-preset-options.type";
import type { E2eProject } from "#e2e/e2e-preset/e2e-project.type";
import { RUNNER_DEVICES } from "#e2e/e2e-preset/runner-devices.constant";

/** An end-to-end test file. */
const E2E_FILE = /\.e2e\.test\.ts$/;

/** The emulated device of `project`; none for an Electron project. */
function deviceOf(project: E2eProject): PlaywrightTestConfig["use"] {
  if (project.target === "desktop") return {};
  const runner = project.base ?? (project.target === "pwa" ? "chromium" : project.name);
  const device = RUNNER_DEVICES[runner];
  if (device === undefined)
    throw new RangeError(
      `e2ePreset: unknown runner "${runner}" (expected ${Object.keys(RUNNER_DEVICES).join(", ")})`,
    );
  return devices[device];
}

/**
 * The Playwright config of an app.
 *
 * @throws RangeError when a project names an unknown runner.
 * @example
 * export default e2ePreset({ root, app: "@acme/web", baseURL: baseUrlOf("web"), projects: ["chromium"] });
 */
export function e2ePreset(options: E2ePresetOptions): PlaywrightTestConfig {
  const isCi = process.env["CI"] !== undefined;
  const projects = options.projects.map((project) =>
    typeof project === "string" ? { name: project } : project,
  );
  const owned = projects.flatMap((project) => (project.match === undefined ? [] : [project.match]));
  return {
    testDir: options.root,
    testMatch: E2E_FILE,
    fullyParallel: false,
    workers: 1, // one stack for the run: seeds reset shared data, so journeys never overlap
    forbidOnly: isCi,
    use: { baseURL: options.baseURL, trace: "retain-on-failure" },
    projects: projects.map((project) => ({
      name: project.name,
      testMatch: project.match ?? E2E_FILE,
      ...(project.match === undefined && owned.length > 0 ? { testIgnore: owned } : {}),
      use: {
        ...deviceOf(project),
        ...(project.locale === undefined ? {} : { locale: project.locale }),
        serviceWorkers: project.serviceWorkers ?? "block",
      },
    })),
    webServer: {
      name: options.app,
      command:
        options.target === undefined ? "stackra dev" : `stackra dev --target ${options.target}`,
      cwd: options.root,
      url: options.baseURL,
      reuseExistingServer: !isCi,
      env: {
        STACKRA_E2E: "1",
        STACKRA_E2E_SERVICES: (options.services ?? []).join(","),
        STACKRA_E2E_SEEDS: (options.seeds ?? []).join(","),
        ...(options.turnstile === undefined ? {} : { STACKRA_E2E_TURNSTILE: options.turnstile }),
      },
    },
  };
}
