/**
 * Stackra file contract:
 * Purpose: `launchCheckJob(request)`, the mobile launch check of one app on one platform: from the root runway's
 *          `mobile` entry (its store ids, `mobileIdsOf`), the ordered commands that install the Release simulator
 *          build and run each Maestro flow of the template checkout with `APP_ID` set, writing a JUnit report and the
 *          flow's screenshots to `<outDir>/<app>/<platform>/`. On iOS it boots and shuts down the simulator; on Android
 *          the workflow has started the emulator (the pinned emulator action).
 * Boundary: reads the root runway; runs nothing (`runLaunchCheck` runs the list on a CI runner, never a developer's
 *           Mac). Every key a request leaves out comes from `LAUNCH_CHECK_DEFAULTS`. The app key becomes a path
 *           segment and the flows and output folder must stay inside their roots, so each is checked. Maestro picks
 *           the one booted simulator or emulator, so no device id is passed to it.
 * Runtime: node
 * Governing contract: STA-265 spec (FR-001, FR-003); ADR 0352 (decision 3: plan, then run the same list); ADR 0441 (as
 *                     amended: D19, the simulator lane on a Mac runner).
 */
import { basename, extname, join } from "node:path";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { mobileIdsOf } from "#core/functions/mobile-ids-of.function";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { LAUNCH_CHECK_DEFAULTS } from "#node/constants/launch-check-defaults.constant";
import { readRunway } from "#node/functions/read-runway.function";
import type { CaptureStep } from "#node/types/capture-step.type";
import type { LaunchCheckJob } from "#node/types/launch-check-job.type";
import type { LaunchCheckRequest } from "#node/types/launch-check-request.type";

/** An app key, used as a path segment. */
const SEGMENT = /^[A-Za-z0-9_-]+$/;

/** A relative path that does not climb out or start with `/`. */
function isInside(path: string): boolean {
  return path !== "" && !path.startsWith("/") && !path.split(/[\\/]/).includes("..");
}

/** One `xcrun simctl` step. */
function simctl(args: string[]): CaptureStep {
  return { command: "xcrun", args: ["simctl", ...args] };
}

/**
 * Defines one app's launch check on one platform.
 *
 * @param request - the repository, the app, the platform, the simulator build, the template checkout, and overrides
 *        of the launch check defaults.
 * @returns the job: runner, flows, report folder and commands.
 * @throws RunwayInvalidError when the app is not in the root runway `mobile`, the app key is not a safe segment, the
 *         output folder or a flow is outside its root, or there is no flow.
 * @example
 * const job = launchCheckJob({ repository: ".", app: "shopper", platform: "ios", appPath, templateDir });
 * await runLaunchCheck(job, ".");
 */
export function launchCheckJob(request: LaunchCheckRequest): LaunchCheckJob {
  const settings = { ...LAUNCH_CHECK_DEFAULTS, ...request };
  const { repository, app, platform, appPath, templateDir, device, outDir, flows } = settings;
  const root = readRunway(join(repository, "runway.yaml"), "root");
  const entry = root.mobile?.[app];
  if (entry === undefined) {
    throw new RunwayInvalidError("runway.yaml", [
      { path: `mobile.${app}`, message: "No such mobile app in the root runway" },
    ]);
  }
  const issues: RunwayIssue[] = [];
  if (!SEGMENT.test(app))
    issues.push({ path: "app", message: "Expected an app key of letters, digits, _ or -" });
  if (!isInside(outDir))
    issues.push({ path: "outDir", message: "Expected a folder inside the repository" });
  if (flows.length === 0) issues.push({ path: "flows", message: "Expected at least one flow" });
  for (const [index, flow] of flows.entries()) {
    if (!isInside(flow))
      issues.push({
        path: `flows.${index}`,
        message: "Expected a flow inside the template checkout",
      });
  }
  if (issues.length > 0) throw new RunwayInvalidError("runway.yaml", issues);

  const ids = mobileIdsOf(root.product?.key ?? root.project, app, entry.identity ?? {});
  const appId = platform === "ios" ? ids.bundleId : ids.packageName;
  const reportDir = `${outDir}/${app}/${platform}`;
  const steps: CaptureStep[] =
    platform === "ios"
      ? [simctl(["boot", device]), simctl(["install", device, appPath])]
      : [{ command: "adb", args: ["install", "-r", appPath] }];
  steps.push({ command: "mkdir", args: ["-p", reportDir] });
  for (const flow of flows) {
    const name = basename(flow, extname(flow));
    steps.push({
      command: "maestro",
      args: [
        "test",
        "--platform",
        platform,
        "-e",
        `APP_ID=${appId}`,
        "--format",
        "junit",
        "--output",
        `${reportDir}/${name}.xml`,
        "--test-output-dir",
        `${reportDir}/${name}`,
        join(templateDir, flow),
      ],
    });
  }
  if (platform === "ios") steps.push(simctl(["shutdown", device]));
  return {
    app,
    platform,
    runner: settings.runner ?? settings.runners[platform],
    flows,
    reportDir,
    steps,
  };
}
