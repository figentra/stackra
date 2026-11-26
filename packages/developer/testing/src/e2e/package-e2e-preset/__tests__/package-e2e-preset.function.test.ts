/**
 * Stackra file contract:
 * Purpose: unit tests of `packageE2ePreset`: the Chromium and Arabic projects, the opt-in Firefox and WebKit projects,
 *          the page server's command, port and directory, the spec pattern and the results folder.
 * Boundary: test only; `@playwright/test` is mocked to its device table, so the Playwright runner never loads under
 *           vitest.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement; package e2e).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { packageE2ePreset } from "#e2e/package-e2e-preset/package-e2e-preset.function";

vi.mock("@playwright/test", () => ({
  devices: {
    "Desktop Chrome": { browserName: "chromium" },
    "Desktop Firefox": { browserName: "firefox" },
    "Desktop Safari": { browserName: "webkit" },
  },
}));

const BASE = { root: "/repo/packages/ui/button", package: "@stackra/button" };
const names = (config: ReturnType<typeof packageE2ePreset>) =>
  config.projects?.map((entry) => entry.name);

describe(packageE2ePreset, () => {
  it("runs Chromium and Arabic Chromium by default", () => {
    const config = packageE2ePreset(BASE);
    expect(names(config)).toEqual(["chromium", "chromium-ar"]);
    expect(config.projects?.[1]?.use).toEqual({ browserName: "chromium", locale: "ar-SA" });
  });

  it("adds Firefox and WebKit only on request", () => {
    expect(names(packageE2ePreset({ ...BASE, browsers: ["firefox"] }))).toEqual([
      "chromium",
      "chromium-ar",
      "firefox",
    ]);
    expect(names(packageE2ePreset({ ...BASE, browsers: ["firefox", "webkit"] }))).toEqual([
      "chromium",
      "chromium-ar",
      "firefox",
      "webkit",
    ]);
  });

  it("matches the specs under the package root in parallel", () => {
    const config = packageE2ePreset(BASE);
    expect(config.testDir).toBe(BASE.root);
    expect(config.testMatch).toEqual(/\.e2e\.test\.ts$/);
    expect(config.fullyParallel).toBe(true);
    expect(config.outputDir).toBe("/repo/packages/ui/button/.stackra/e2e-results");
    // the report sits beside the results, never inside them (the reporter clears its own folder)
    expect(config.reporter).toContainEqual([
      "html",
      { outputFolder: "/repo/packages/ui/button/.stackra/e2e-report", open: "never" },
    ]);
    expect(config.use).toEqual({ baseURL: "http://127.0.0.1:5199", trace: "retain-on-failure" });
  });

  it("serves the pages with Vite from the package on the given port", () => {
    const server = packageE2ePreset({ ...BASE, port: 6001 }).webServer;
    expect(server).toMatchObject({
      command:
        "pnpm exec vite --config .stackra/e2e/vite.config.ts --host 127.0.0.1 --port 6001 --strictPort",
      cwd: BASE.root,
      url: "http://127.0.0.1:6001",
    });
    expect(packageE2ePreset(BASE).webServer).toMatchObject({ url: "http://127.0.0.1:5199" });
  });
});
