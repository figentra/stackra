/**
 * Stackra file contract:
 * Purpose: unit tests of `launchCheckJob` and `runLaunchCheck`: on iOS the job boots the simulator, installs the
 *          build, runs each Maestro flow of the template checkout with the bundle id as `APP_ID` and a JUnit report,
 *          and shuts down; on Android it installs the APK on the running emulator and runs the flows with the package
 *          name; ids fall back to `mobileIdsOf`; overrides replace defaults; an unknown app, an unsafe app key, a
 *          folder or flow outside its root and no flow are refused; the runner runs exactly the job's list and stops
 *          at the first failing command.
 * Boundary: test only; runs in a temporary folder with a fake command runner, so no simulator, emulator or Maestro is
 *           touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-265 spec (FR-001 to FR-003, D5); ADR 0352 (decision 3).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { launchCheckJob } from "#node/functions/launch-check-job.function";
import { runLaunchCheck } from "#node/functions/run-launch-check.function";
import type { CommandRunner } from "#node/types/command-runner.type";

const APP = {
  template: "os/mobile@3",
  identity: {
    name: { en: "Shopper" },
    ios: { bundleId: "com.figentra.commerce.shopper" },
    android: { package: "com.figentra.commerce.shopper_app" },
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

const request = { app: "shopper", templateDir: "template" };

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-launch-check-"));
  writeRoot(APP);
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("launchCheckJob", () => {
  // @covers sta-265:FR-001
  it("boots the simulator, installs the build and runs the launch flow on iOS", () => {
    const job = launchCheckJob({
      repository,
      ...request,
      platform: "ios",
      appPath: "build/Shopper.app",
    });
    expect(job.runner).toBe("macos");
    expect(job.flows).toEqual([".maestro/launch.yaml"]);
    expect(job.reportDir).toBe(".stackra/launch-check/shopper/ios");
    expect(job.steps.map((step) => [step.command, ...step.args].join(" "))).toEqual([
      "xcrun simctl boot iPhone 16 Pro Max",
      "xcrun simctl install iPhone 16 Pro Max build/Shopper.app",
      "mkdir -p .stackra/launch-check/shopper/ios",
      "maestro test --platform ios -e APP_ID=com.figentra.commerce.shopper --format junit --output .stackra/launch-check/shopper/ios/launch.xml --test-output-dir .stackra/launch-check/shopper/ios/launch template/.maestro/launch.yaml",
      "xcrun simctl shutdown iPhone 16 Pro Max",
    ]);
  });

  // @covers sta-265:FR-001
  it("installs the APK on the running emulator and runs the flows on Android", () => {
    const job = launchCheckJob({
      repository,
      ...request,
      platform: "android",
      appPath: "build/shopper.apk",
    });
    expect(job.runner).toBe("ubuntu-latest");
    expect(job.steps.map((step) => [step.command, ...step.args].join(" "))).toEqual([
      "adb install -r build/shopper.apk",
      "mkdir -p .stackra/launch-check/shopper/android",
      "maestro test --platform android -e APP_ID=com.figentra.commerce.shopper_app --format junit --output .stackra/launch-check/shopper/android/launch.xml --test-output-dir .stackra/launch-check/shopper/android/launch template/.maestro/launch.yaml",
    ]);
  });

  // @covers sta-265:FR-003
  it("derives the ids when the runway sets none, and takes overrides", () => {
    writeRoot({ template: "os/mobile@3", identity: { name: { en: "Shopper" } } });
    const job = launchCheckJob({
      repository,
      ...request,
      platform: "ios",
      appPath: "build/Shopper.app",
      runner: "macos-15",
      device: "SIM-1",
      flows: [".maestro/launch.yaml", ".maestro/camera.yaml"],
    });
    expect(job.runner).toBe("macos-15");
    const flows = job.steps.filter((step) => step.command === "maestro");
    expect(flows.map((step) => step.args.at(-1))).toEqual([
      "template/.maestro/launch.yaml",
      "template/.maestro/camera.yaml",
    ]);
    expect(flows[0]?.args).toContain("APP_ID=com.figentra.commerce.shopper");
    expect(job.steps[0]?.args).toEqual(["simctl", "boot", "SIM-1"]);
  });

  // @covers sta-265:FR-001
  it("refuses an unknown app", () => {
    expect(
      issuePaths(() =>
        launchCheckJob({ repository, ...request, app: "staff", platform: "ios", appPath: "a.app" }),
      ),
    ).toEqual(["mobile.staff"]);
  });

  // @covers sta-265:FR-001
  it("refuses an output folder or a flow outside its root, and no flow", () => {
    const ios = { repository, ...request, platform: "ios", appPath: "a.app" } as const;
    expect(
      issuePaths(() =>
        launchCheckJob({ ...ios, outDir: "../out", flows: ["/abs.yaml", "../x.yaml"] }),
      ),
    ).toEqual(["outDir", "flows.0", "flows.1"]);
    expect(issuePaths(() => launchCheckJob({ ...ios, flows: [] }))).toEqual(["flows"]);
  });
});

/** The iOS job of the test repository. */
function iosJob() {
  return launchCheckJob({ repository, ...request, platform: "ios", appPath: "build/Shopper.app" });
}

describe("runLaunchCheck", () => {
  // @covers sta-265:FR-002
  it("runs exactly the job's commands in order from the repository", async () => {
    const calls: string[] = [];
    const run: CommandRunner = async (command, args, options) => {
      calls.push(`${options.cwd} ${command} ${args.join(" ")}`);
      return "";
    };
    await runLaunchCheck(iosJob(), repository, run);
    expect(calls).toEqual(
      iosJob().steps.map((step) => `${repository} ${step.command} ${step.args.join(" ")}`),
    );
  });

  // @covers sta-265:FR-002
  it("stops at a failing flow, so the job fails", async () => {
    const calls: string[] = [];
    const run: CommandRunner = async (command) => {
      calls.push(command);
      if (command === "maestro")
        throw new Error("Assertion is false: id: stackra-launch-ready is visible");
      return "";
    };
    await expect(runLaunchCheck(iosJob(), repository, run)).rejects.toThrow("stackra-launch-ready");
    expect(calls).toEqual(["xcrun", "xcrun", "mkdir", "maestro"]);
  });
});
