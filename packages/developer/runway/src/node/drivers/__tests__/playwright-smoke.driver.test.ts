/**
 * Stackra file contract:
 * Purpose: unit tests of `PlaywrightSmokeDriver`: a page that loads, renders text and raises no error passes with a
 *          screenshot; an HTTP error, a blank first screen, a console or page error and a critical axe violation each
 *          fail it with one problem line; the browser is closed either way.
 * Boundary: test only; a fake browser and page replace Playwright, and a fake audit replaces axe.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-265 spec (D6, FR-010).
 */
import type { Browser, Page } from "@playwright/test";
import { describe, expect, it } from "@stackra/testing";

import { SmokeDriver } from "#core/ports/smoke-driver.port";
import { PlaywrightSmokeDriver } from "#node/drivers/playwright-smoke.driver";

/** What the fake page does. */
type Script = {
  readonly status?: number;
  readonly rendered?: boolean;
  readonly consoleError?: string;
  readonly pageError?: string;
  readonly critical?: readonly string[];
};

const SUBJECT = { target: "web", name: "console", url: "https://console.x.example.com/" } as const;

/** A driver over a fake browser that follows `script`; `closed` and `shots` record the browser's use. */
function driver(script: Script): {
  web: PlaywrightSmokeDriver;
  closed: boolean[];
  shots: string[];
} {
  const closed: boolean[] = [];
  const shots: string[] = [];
  const handlers: Record<string, (value: unknown) => void> = {};
  const page = {
    on: (event: string, handler: (value: unknown) => void) => {
      handlers[event] = handler;
    },
    goto: async () => {
      if (script.consoleError !== undefined)
        handlers["console"]?.({ type: () => "error", text: () => script.consoleError });
      if (script.pageError !== undefined) handlers["pageerror"]?.(new Error(script.pageError));
      return { status: () => script.status ?? 200 };
    },
    waitForFunction: async () => {
      if (script.rendered === false) throw new Error("timeout");
    },
    screenshot: async ({ path }: { path: string }) => {
      shots.push(path);
    },
  };
  const browser = {
    newPage: async () => page,
    close: async () => {
      closed.push(true);
    },
  };
  const web = new PlaywrightSmokeDriver();
  web.launch = async () => browser as unknown as Browser;
  web.audit = async (_page: Page) => script.critical ?? [];
  return { web, closed, shots };
}

describe("PlaywrightSmokeDriver", () => {
  it("is the web driver of the SmokeDriver port", () => {
    const { web } = driver({});
    expect(web).toBeInstanceOf(SmokeDriver);
    expect(web.target).toBe("web");
  });

  // @covers sta-265:FR-010
  it("passes a page that loads and renders, with a screenshot", async () => {
    const { web, closed, shots } = driver({});
    await expect(web.check(SUBJECT, "/repo")).resolves.toEqual({
      target: "web",
      name: "console",
      passed: true,
      problems: [],
      evidence: ".stackra/smoke/web/console.png",
    });
    expect(shots).toEqual(["/repo/.stackra/smoke/web/console.png"]);
    expect(closed).toEqual([true]);
  });

  // @covers sta-265:FR-010
  it("fails on an HTTP error, a blank screen, console and page errors and critical axe rules", async () => {
    const { web, closed } = driver({
      status: 500,
      rendered: false,
      consoleError: "Failed to load module",
      pageError: "x is not a function",
      critical: ["aria-hidden-focus"],
    });
    const result = await web.check(SUBJECT, "/repo");
    expect(result.passed).toBe(false);
    expect(result.problems).toEqual([
      "console error: Failed to load module",
      "page error: x is not a function",
      "HTTP 500 from https://console.x.example.com/",
      "the first screen rendered no text",
      "axe critical: aria-hidden-focus",
    ]);
    expect(closed).toEqual([true]);
  });

  it("refuses a subject of another target", async () => {
    const { web } = driver({});
    await expect(
      web.check({ target: "desktop", name: "till", appPath: "Till.app" }, "/repo"),
    ).rejects.toThrow("cannot check a desktop subject");
  });
});
