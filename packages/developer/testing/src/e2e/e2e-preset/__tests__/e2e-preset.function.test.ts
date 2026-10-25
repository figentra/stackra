/**
 * Stackra file contract:
 * Purpose: unit tests of `e2ePreset`: runner names become device projects, an RTL project copies its base with a
 *          locale, a project with `match` owns its files and the others skip them, service workers stay blocked unless
 *          a project allows them, an unknown runner throws, and the stack starts in e2e mode with its inputs.
 * Boundary: test only; `@playwright/test` is mocked to its device table, so the Playwright runner never loads under
 *           vitest.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { e2ePreset } from "#e2e/e2e-preset/e2e-preset.function";

vi.mock("@playwright/test", () => ({
  devices: {
    "Desktop Chrome": { browserName: "chromium" },
    "iPhone 15": { browserName: "webkit", isMobile: true },
  },
}));

/** The console's config, as gen writes it. */
const CONFIG = e2ePreset({
  root: "/repo/apps/console",
  app: "@acme/console",
  baseURL: "http://localhost:5174",
  services: ["@acme/service-commerce", "identity"],
  seeds: ["orders.demo"],
  projects: [
    "chromium",
    "mobile-safari",
    { name: "chromium-rtl", base: "chromium", locale: "ar" },
    { name: "pwa", target: "pwa", serviceWorkers: "allow", match: /\.offline\.e2e\.test\.ts$/ },
    { name: "desktop", target: "desktop", match: /\.desktop\.e2e\.test\.ts$/ },
  ],
});

/** The project named `name`. */
const project = (name: string) => CONFIG.projects?.find((entry) => entry.name === name);

describe(e2ePreset, () => {
  it("roots the run at the member with one worker on the app's origin", () => {
    expect(CONFIG.testDir).toBe("/repo/apps/console");
    expect(CONFIG.workers).toBe(1);
    expect(CONFIG.use?.baseURL).toBe("http://localhost:5174");
  });

  it("builds each project from its runner, locale and service-worker mode", () => {
    expect(project("mobile-safari")?.use).toEqual({
      browserName: "webkit",
      isMobile: true,
      serviceWorkers: "block",
    });
    expect(project("chromium-rtl")?.use).toEqual({
      browserName: "chromium",
      locale: "ar",
      serviceWorkers: "block",
    });
    expect(project("pwa")?.use).toEqual({ browserName: "chromium", serviceWorkers: "allow" });
    expect(project("desktop")?.use).toEqual({ serviceWorkers: "block" });
  });

  it("gives a matched project its files and keeps them out of the others", () => {
    expect(project("pwa")?.testMatch).toEqual(/\.offline\.e2e\.test\.ts$/);
    expect(project("chromium")?.testIgnore).toEqual([
      /\.offline\.e2e\.test\.ts$/,
      /\.desktop\.e2e\.test\.ts$/,
    ]);
    expect(project("pwa")?.testIgnore).toBeUndefined();
  });

  it("starts the stack in e2e mode with its services and seeds", () => {
    expect(CONFIG.webServer).toMatchObject({
      command: "stackra dev",
      cwd: "/repo/apps/console",
      url: "http://localhost:5174",
      env: {
        STACKRA_E2E: "1",
        STACKRA_E2E_SERVICES: "@acme/service-commerce,identity",
        STACKRA_E2E_SEEDS: "orders.demo",
      },
    });
  });

  it("refuses an unknown runner", () => {
    expect(() =>
      e2ePreset({ root: "/r", app: "a", baseURL: "http://x", projects: ["opera"] }),
    ).toThrow(RangeError);
  });
});
