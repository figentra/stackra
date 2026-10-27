/**
 * Stackra file contract:
 * Purpose: unit tests of `screenshotCaptureJob` and `runScreenshotCapture`: the job boots the simulator, installs the
 *          demo build, and per captioned locale launches in that language, opens the demo link and each screen link
 *          and saves `<outDir>/<app>/<locale>/<screen>.png`; overrides replace defaults; an unknown app, an app with
 *          no iOS bundle id or scheme, a folder outside the repository, no captions and an unsafe screen id are
 *          refused; the runner runs exactly the job's list in order.
 * Boundary: test only; runs in a temporary folder with a fake command runner, so no simulator is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended: D19); ADR 0352 (decision 3).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { runScreenshotCapture } from "#node/functions/run-screenshot-capture.function";
import { screenshotCaptureJob } from "#node/functions/screenshot-capture-job.function";
import type { CommandRunner } from "#node/types/command-runner.type";

const APP = {
  template: "os/mobile@3",
  identity: {
    name: { en: "Shopper" },
    ios: { bundleId: "com.figentra.commerce.shopper" },
    scheme: "shopper",
  },
};

let repository: string;

/** Writes the root runway with `mobile.shopper` set to `app`. */
function writeRoot(app: unknown): void {
  writeFileSync(
    join(repository, "runway.yaml"),
    JSON.stringify({ version: 3, project: "commerce", environments: {}, mobile: { shopper: app } }),
  );
}

/** Writes `assets/store/shopper/<locale>/captions.json` with `screens`. */
function writeCaptions(locale: string, screens: string[]): void {
  const folder = join(repository, "assets", "store", "shopper", locale);
  mkdirSync(folder, { recursive: true });
  writeFileSync(
    join(folder, "captions.json"),
    JSON.stringify({ captions: screens.map((screen) => ({ screen, text: `Caption ${screen}` })) }),
  );
}

/** The paths of the RunwayInvalidError `run` throws. */
function issuePaths(run: () => unknown): string[] {
  try {
    run();
  } catch (error) {
    if (error instanceof RunwayInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  throw new Error("expected a RunwayInvalidError");
}

const request = { app: "shopper", appPath: "build/Shopper.app", settleMs: 0 };

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-capture-job-"));
  writeRoot(APP);
  writeCaptions("en-US", ["home", "cart"]);
  writeCaptions("ar-SA", ["home"]);
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("screenshotCaptureJob", () => {
  it("captures every captioned screen per locale on the Mac runner", () => {
    const job = screenshotCaptureJob({ repository, ...request });
    expect(job.runner).toBe("macos");
    expect(job.outDir).toBe(".stackra/screenshots");
    expect(job.locales).toEqual([
      { locale: "ar-SA", screens: ["home"] },
      { locale: "en-US", screens: ["home", "cart"] },
    ]);
    const lines = job.steps.map((step) => [step.command, ...step.args].join(" "));
    expect(lines).toEqual([
      "xcrun simctl boot iPhone 16 Pro Max",
      "xcrun simctl install iPhone 16 Pro Max build/Shopper.app",
      "mkdir -p .stackra/screenshots/shopper/ar-SA",
      "xcrun simctl launch --terminate-running-process iPhone 16 Pro Max com.figentra.commerce.shopper -AppleLanguages (ar-SA) -AppleLocale ar-SA",
      "xcrun simctl openurl iPhone 16 Pro Max shopper://demo?locale=ar-SA",
      "xcrun simctl openurl iPhone 16 Pro Max shopper://store-screenshot/home",
      "xcrun simctl io iPhone 16 Pro Max screenshot .stackra/screenshots/shopper/ar-SA/home.png",
      "mkdir -p .stackra/screenshots/shopper/en-US",
      "xcrun simctl launch --terminate-running-process iPhone 16 Pro Max com.figentra.commerce.shopper -AppleLanguages (en-US) -AppleLocale en-US",
      "xcrun simctl openurl iPhone 16 Pro Max shopper://demo?locale=en-US",
      "xcrun simctl openurl iPhone 16 Pro Max shopper://store-screenshot/home",
      "xcrun simctl io iPhone 16 Pro Max screenshot .stackra/screenshots/shopper/en-US/home.png",
      "xcrun simctl openurl iPhone 16 Pro Max shopper://store-screenshot/cart",
      "xcrun simctl io iPhone 16 Pro Max screenshot .stackra/screenshots/shopper/en-US/cart.png",
      "xcrun simctl shutdown iPhone 16 Pro Max",
    ]);
  });

  it("takes overrides of the defaults", () => {
    const job = screenshotCaptureJob({
      repository,
      ...request,
      runner: "macos-15",
      device: "SIM-1",
      screenLink: "{scheme}://shot/{screen}?lang={locale}",
      settleMs: 500,
    });
    expect(job.runner).toBe("macos-15");
    expect(job.steps).toContainEqual({
      command: "xcrun",
      args: ["simctl", "openurl", "SIM-1", "shopper://shot/home?lang=ar-SA"],
      settleMs: 500,
    });
  });

  it("refuses an unknown app", () => {
    expect(
      issuePaths(() => screenshotCaptureJob({ repository, ...request, app: "staff" })),
    ).toEqual(["mobile.staff"]);
  });

  it("refuses an app without an iOS bundle id or scheme, and folders outside the repository", () => {
    writeRoot({ template: "os/mobile@3", identity: { name: { en: "Shopper" } } });
    expect(
      issuePaths(() => screenshotCaptureJob({ repository, ...request, outDir: "../out" })),
    ).toEqual(["mobile.shopper.identity.ios", "mobile.shopper.identity.scheme", "outDir"]);
  });

  it("refuses an app with no captions and an unsafe screen id", () => {
    rmSync(join(repository, "assets"), { recursive: true });
    expect(issuePaths(() => screenshotCaptureJob({ repository, ...request }))).toEqual([
      "assets/store/shopper",
    ]);
    writeCaptions("en-US", ["../home"]);
    expect(issuePaths(() => screenshotCaptureJob({ repository, ...request }))).toEqual([
      "assets/store/shopper/en-US/captions.json",
    ]);
  });
});

describe("runScreenshotCapture", () => {
  it("runs exactly the job's commands in order from the repository", async () => {
    const job = screenshotCaptureJob({ repository, ...request });
    const calls: string[] = [];
    const run: CommandRunner = async (command, args, options) => {
      calls.push(`${options.cwd} ${command} ${args.join(" ")}`);
      return "";
    };
    await runScreenshotCapture(job, repository, run);
    expect(calls).toEqual(
      job.steps.map((step) => `${repository} ${step.command} ${step.args.join(" ")}`),
    );
  });
});
