/**
 * Stackra file contract:
 * Purpose: `ElectronSmokeDriver`, the `desktop` driver of the `SmokeDriver` port: a placeholder until a product has a
 *          desktop target (ADR 0058). It fails every subject with "not built", so no desktop app passes unchecked.
 * Boundary: runs nothing. The real driver launches the packaged app with Playwright's Electron mode and checks its
 *           first window as the web driver checks a page; it is built with the first desktop target.
 * Runtime: node
 * Governing contract: STA-265 spec (D6, FR-012); ADR 0058 (desktop is Electron).
 */
import { Driver } from "@stackra/container";

import { SmokeDriver } from "#core/ports/smoke-driver.port";
import type { SmokeResult } from "#core/types/smoke-result.type";
import type { SmokeSubject } from "#core/types/smoke-subject.type";

/**
 * The desktop smoke check, not built yet.
 *
 * @example
 * await new ElectronSmokeDriver().check({ target: "desktop", name: "till", appPath: "dist/Till.app" }, ".");
 */
export class ElectronSmokeDriver extends Driver(SmokeDriver) {
  /** The target this driver checks. */
  override readonly target = "desktop";

  /** Fails the subject: the desktop smoke check is not built. */
  override async check(subject: SmokeSubject): Promise<SmokeResult> {
    return {
      target: "desktop",
      name: subject.name,
      passed: false,
      problems: ["the desktop smoke check is not built (Playwright's Electron mode, ADR 0058)"],
    };
  }
}
