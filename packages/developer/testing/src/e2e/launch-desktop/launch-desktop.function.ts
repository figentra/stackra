/**
 * Stackra file contract:
 * Purpose: `launchDesktop(options)`, starts the app's built desktop target under Playwright's Electron driver for a
 *          `desktop` project journey, with the faked bridges in `STACKRA_E2E_FAKES` and `STACKRA_E2E=1`.
 * Boundary: launches the main bundle the desktop build writes (`dist/desktop/main.js` under the member root, the
 *           project's `testDir`); build it first. The caller closes the app. Only inside a test or a hook.
 * Runtime: node
 * Governing contract: ADR 0251 (hardening, bridges); ADR 0254 (desktop build); ADR 0269 (decision 6).
 */
import { join } from "node:path";
import { _electron, test } from "@playwright/test";

import type { DesktopApp } from "#e2e/launch-desktop/desktop-app.type";
import type { LaunchDesktopOptions } from "#e2e/launch-desktop/launch-desktop-options.type";

/** The main bundle of the desktop build, under the member root. */
const MAIN = "dist/desktop/main.js";

/**
 * Launches the desktop app.
 *
 * @example
 * const app = await launchDesktop({ fakes: { "peripherals.receipt.print": { printer: "fake-escpos" } } });
 * const window = await app.firstWindow();
 */
export async function launchDesktop(options: LaunchDesktopOptions = {}): Promise<DesktopApp> {
  const root = test.info().project.testDir;
  const inherited = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
  const app = await _electron.launch({
    args: [join(root, MAIN)],
    cwd: root,
    env: { ...inherited, STACKRA_E2E: "1", STACKRA_E2E_FAKES: JSON.stringify(options.fakes ?? {}) },
  });
  return Object.assign(app, {
    openUrl: async (url: string): Promise<void> => {
      await app.evaluate(({ app: electron }, link) => {
        electron.emit("open-url", { preventDefault: () => undefined }, link);
      }, url);
    },
  });
}
