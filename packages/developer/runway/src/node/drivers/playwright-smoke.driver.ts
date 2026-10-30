/**
 * Stackra file contract:
 * Purpose: `PlaywrightSmokeDriver`, the `web` driver of the `SmokeDriver` port: opens a surface's preview URL in
 *          headless Chromium and fails on HTTP 400 or above, a first screen with no text, any console error or page
 *          error, and a critical axe violation; saves a screenshot to `<outDir>/web/<surface>.png`.
 * Boundary: loads `@playwright/test` and `@axe-core/playwright` (optional peers, `catalog:e2e`) only when it runs, so
 *           runway's other entries never need them. Reads the page only: it clicks, types and signs in to nothing.
 *           `launch` and `audit` are replaced by a test.
 * Runtime: node
 * Governing contract: STA-265 spec (D6, FR-010); ADR 0302 (Playwright and axe in CI).
 */
import { join } from "node:path";

import type { Browser, Page } from "@playwright/test";
import { Driver } from "@stackra/container";

import { SmokeDriver } from "#core/ports/smoke-driver.port";
import type { SmokeResult } from "#core/types/smoke-result.type";
import type { SmokeSubject } from "#core/types/smoke-subject.type";

/**
 * The web smoke check.
 *
 * @example
 * await new PlaywrightSmokeDriver().check({ target: "web", name: "console", url: "https://console.pr-7.example.com/" }, ".");
 */
export class PlaywrightSmokeDriver extends Driver(SmokeDriver) {
  /** The target this driver checks. */
  override readonly target = "web";

  /** Screenshots folder, relative to the repository. */
  outDir = ".stackra/smoke";

  /** Milliseconds the page has to load and render its first screen. */
  timeoutMs = 30_000;

  /** Starts the browser; headless Chromium. */
  launch: () => Promise<Browser> = async () => (await import("@playwright/test")).chromium.launch();

  /** The page's critical axe violations, one rule id each. */
  audit: (page: Page) => Promise<readonly string[]> = async (page) => {
    const { AxeBuilder } = await import("@axe-core/playwright");
    const { violations } = await new AxeBuilder({ page }).analyze();
    return violations.filter((item) => item.impact === "critical").map((item) => item.id);
  };

  /** Opens the surface and reports what failed. */
  override async check(subject: SmokeSubject, repository: string): Promise<SmokeResult> {
    if (subject.target !== "web")
      throw new Error(`The web driver cannot check a ${subject.target} subject`);
    const problems: string[] = [];
    const evidence = `${this.outDir}/web/${subject.name}.png`;
    const browser = await this.launch();
    try {
      const page = await browser.newPage();
      page.on("console", (message) => {
        if (message.type() === "error") problems.push(`console error: ${message.text()}`);
      });
      page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
      const response = await page.goto(subject.url, { waitUntil: "load", timeout: this.timeoutMs });
      if (response === null || response.status() >= 400)
        problems.push(`HTTP ${response?.status() ?? "no response"} from ${subject.url}`);
      const rendered = await page
        // A string, so runway (node only) needs no DOM types.
        .waitForFunction("document.body.innerText.trim().length > 0", undefined, {
          timeout: this.timeoutMs,
        })
        .then(() => true)
        .catch(() => false);
      if (!rendered) problems.push("the first screen rendered no text");
      for (const rule of await this.audit(page)) problems.push(`axe critical: ${rule}`);
      await page.screenshot({ path: join(repository, evidence), fullPage: true });
    } finally {
      await browser.close();
    }
    return { target: "web", name: subject.name, passed: problems.length === 0, problems, evidence };
  }
}
