/**
 * Stackra file contract:
 * Purpose: `screenshotCaptureJob(request)`, the store-screenshot capture job of one app: from the root runway's
 *          `mobile` entry (iOS bundle id, URL scheme) and the captions under `<storeDir>/<app>/<locale>/captions.json`,
 *          the ordered `xcrun simctl` commands that boot the simulator, install the demo-data build, and per locale
 *          launch the app in that language, open the demo link, open each captioned screen and save
 *          `<outDir>/<app>/<locale>/<screen>.png`, where @stackra/brand-kit's store frames read them.
 * Boundary: reads the root runway and the captions files; runs nothing (`runScreenshotCapture` runs the list on a Mac
 *           CI runner, never a developer's Mac). Every key a request leaves out comes from
 *           `SCREENSHOT_CAPTURE_DEFAULTS`. App, locale and screen ids become path segments, so each is checked.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D19, decision 7, screenshots from the real app on a simulator with demo
 *                     data, per locale); ADR 0352 (decision 3: plan, then run the same list); app-shells section 14.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { SCREENSHOT_CAPTURE_DEFAULTS } from "#node/constants/screenshot-capture-defaults.constant";
import { readRunway } from "#node/functions/read-runway.function";
import type { CaptureStep } from "#node/types/capture-step.type";
import type { ScreenshotCaptureJob } from "#node/types/screenshot-capture-job.type";
import type { ScreenshotCaptureRequest } from "#node/types/screenshot-capture-request.type";

/** A path segment: an app key, a locale folder or a screen id (the kit's own caption rule). */
const SEGMENT = /^[A-Za-z0-9_-]+$/;

/** A repository-relative folder that does not climb out or start with `/`. */
function isInside(path: string): boolean {
  return path !== "" && !path.startsWith("/") && !path.split(/[\\/]/).includes("..");
}

/** `template` with each `{key}` replaced. */
function fill(template: string, values: Record<string, string>): string {
  return template.replaceAll(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** The screens of one captions file, or a problem line. */
function screensOf(file: string, at: string): string[] | string {
  let list: unknown;
  try {
    list = (JSON.parse(readFileSync(file, "utf8")) as { captions?: unknown } | null)?.captions;
  } catch {
    return `${at}: not JSON`;
  }
  if (!Array.isArray(list) || list.length === 0)
    return `${at}: "captions" must be a non-empty list`;
  const screens = list.map((item) => (item as { screen?: unknown } | null)?.screen);
  return screens.every(
    (screen): screen is string => typeof screen === "string" && SEGMENT.test(screen),
  )
    ? screens
    : `${at}: each caption needs a "screen" id of letters, digits, _ or -`;
}

/** One `xcrun simctl` step, with its settle time when given. */
function simctl(args: string[], settle?: number): CaptureStep {
  return {
    command: "xcrun",
    args: ["simctl", ...args],
    ...(settle === undefined ? {} : { settleMs: settle }),
  };
}

/**
 * Defines one app's capture job.
 *
 * @param request - the repository, the app, the simulator build, and overrides of the capture defaults.
 * @returns the job: runner, simulator, locales with their screens, output folder and commands.
 * @throws RunwayInvalidError when the app is not in the root runway `mobile`, has no iOS bundle id or URL scheme, a
 *         folder is outside the repository, or the app has no usable captions.
 * @example
 * const job = screenshotCaptureJob({ repository: ".", app: "shopper", appPath: "build/Shopper.app" });
 * await runScreenshotCapture(job, ".");
 */
export function screenshotCaptureJob(request: ScreenshotCaptureRequest): ScreenshotCaptureJob {
  const settings = { ...SCREENSHOT_CAPTURE_DEFAULTS, ...request };
  const { repository, app, appPath, device, storeDir, outDir, settleMs } = settings;
  const root = readRunway(join(repository, "runway.yaml"), "root");
  const entry = root.mobile?.[app];
  const at = `mobile.${app}`;
  const issues: RunwayIssue[] = [];
  if (entry === undefined) {
    throw new RunwayInvalidError("runway.yaml", [
      { path: at, message: "No such mobile app in the root runway" },
    ]);
  }
  const bundleId = entry.identity?.ios?.bundleId;
  const scheme = entry.identity?.scheme;
  if (bundleId === undefined) {
    issues.push({
      path: `${at}.identity.ios`,
      message: "The capture lane runs on the iOS simulator; set ios.bundleId",
    });
  }
  if (scheme === undefined) {
    issues.push({
      path: `${at}.identity.scheme`,
      message: "The capture lane opens the demo and screen links; set scheme",
    });
  }
  if (!SEGMENT.test(app))
    issues.push({ path: "app", message: "Expected an app key of letters, digits, _ or -" });
  for (const [key, folder] of [
    ["storeDir", storeDir],
    ["outDir", outDir],
  ] as const) {
    if (!isInside(folder))
      issues.push({ path: key, message: "Expected a folder inside the repository" });
  }
  if (issues.length > 0) throw new RunwayInvalidError("runway.yaml", issues);

  const appStore = join(repository, storeDir, app);
  const locales: { locale: string; screens: string[] }[] = [];
  const captionIssues: RunwayIssue[] = [];
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const locale of existsSync(appStore) ? readdirSync(appStore).sort() : []) {
    const file = join(appStore, locale, "captions.json");
    if (!existsSync(file)) continue;
    const path = `${storeDir}/${app}/${locale}/captions.json`;
    const screens = SEGMENT.test(locale)
      ? screensOf(file, path)
      : `${path}: unsafe locale folder name`;
    if (typeof screens === "string") captionIssues.push({ path, message: screens });
    else locales.push({ locale, screens });
  }
  if (locales.length === 0 && captionIssues.length === 0) {
    captionIssues.push({
      path: `${storeDir}/${app}`,
      message: "No <locale>/captions.json to capture screens for",
    });
  }
  if (captionIssues.length > 0) throw new RunwayInvalidError(`${storeDir}/${app}`, captionIssues);

  const ios = bundleId as string;
  const links = { scheme: scheme as string };
  const steps: CaptureStep[] = [simctl(["boot", device]), simctl(["install", device, appPath])];
  for (const { locale, screens } of locales) {
    const folder = `${outDir}/${app}/${locale}`;
    steps.push(
      { command: "mkdir", args: ["-p", folder] },
      simctl(
        [
          "launch",
          "--terminate-running-process",
          device,
          ios,
          "-AppleLanguages",
          `(${locale})`,
          "-AppleLocale",
          locale,
        ],
        settleMs,
      ),
      simctl(["openurl", device, fill(settings.demoLink, { ...links, locale })], settleMs),
    );
    for (const screen of screens) {
      steps.push(
        simctl(
          ["openurl", device, fill(settings.screenLink, { ...links, locale, screen })],
          settleMs,
        ),
        simctl(["io", device, "screenshot", `${folder}/${screen}.png`]),
      );
    }
  }
  steps.push(simctl(["shutdown", device]));
  return { app, runner: settings.runner, device, locales, outDir, steps };
}
