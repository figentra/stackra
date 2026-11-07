/**
 * Stackra file contract:
 * Purpose: `runMobileOnboard(cwd, values)`, the run of `stackra mobile onboard [--app <key>] [--check|--live]` at a
 *          product root: onboards one mobile app (Runway's `onboardMobile`) and resolves with its ids, every step with
 *          its state and the owner's steps, and the files written. The default is an offline plan: the memory drivers
 *          start empty, so it reads no secret, calls no store and plans every step as if nothing existed. `--check`
 *          reads the real stores and plans only what is missing; `--live` makes the changes. Both run only in the
 *          product's production job, proved by its GitHub OIDC token (`proveGithubJob`), where the keys are.
 * Boundary: validates the flags and chooses the drivers; the steps are Runway's and `MobileOnboardCommand` draws
 *           them. `--app` defaults to the only app of the runway's `mobile`.
 * Runtime: node
 * Governing contract: ADR 0482 (decisions 1 and 9), ADR 0480 (decision 5: live only in CI); ADR 0506; STA-1966; STA-2100.
 */
import { join } from "node:path";

import type { MobileOnboard } from "@stackra/runway/node";
import {
  AscAppleDeveloperDriver,
  ExpoGraphqlProjectsDriver,
  FirebaseManagementDriver,
  GoogleCloudDriver,
  GooglePlayConsoleDriver,
  MemoryAppleDeveloperDriver,
  MemoryExpoProjectsDriver,
  MemoryFirebaseDriver,
  MemoryGoogleCloudDriver,
  MemoryPlayConsoleDriver,
  MemorySentryProjectsDriver,
  onboardMobile,
  proveGithubJob,
  readRunway,
  SentryApiProjectsDriver,
} from "@stackra/runway/node";

import { CliUsageError } from "#node/errors/cli-usage.error";

/**
 * Onboards one mobile app and resolves with Runway's result: its ids, every step and the files written.
 *
 * @param cwd - the product root.
 * @param values - `app`, and the `check` or `live` flag.
 * @throws CliUsageError when the app is not named and the runway has several, or `--check`/`--live` run outside CI.
 * @example
 * const { steps } = await runMobileOnboard(root, { app: "academorix", check: false, live: false });
 */
export async function runMobileOnboard(
  cwd: string,
  values: {
    readonly app?: string | undefined;
    readonly check: boolean;
    readonly live: boolean;
  },
): Promise<MobileOnboard> {
  const live = values.live;
  const real = live || values.check;
  if (live && values.check) throw new CliUsageError("pass --check or --live, not both");
  const root = readRunway(join(cwd, "runway.yaml"), "root");
  // Proved by the job's GitHub OIDC token in the production environment, never by GITHUB_ACTIONS (STA-2100).
  if (real)
    await proveGithubJob({ github: root.providers?.github, environment: "production" }).catch(
      (error: unknown) => {
        throw new CliUsageError(
          `--check and --live run only in the product's production job; run without them for an offline plan (${(error as Error).message})`,
        );
      },
    );
  const apps = Object.keys(root.mobile ?? {});
  const app = values.app ?? (apps.length === 1 ? apps[0] : undefined);
  if (app === undefined)
    throw new CliUsageError(`name the app: --app <${apps.join("|") || "key"}>`);

  const ports = real
    ? {
        apple: new AscAppleDeveloperDriver(),
        play: new GooglePlayConsoleDriver(),
        expo: new ExpoGraphqlProjectsDriver(),
        google: new GoogleCloudDriver(),
        firebase: new FirebaseManagementDriver(),
        sentry: new SentryApiProjectsDriver(),
      }
    : {
        apple: new MemoryAppleDeveloperDriver(),
        play: new MemoryPlayConsoleDriver(),
        expo: new MemoryExpoProjectsDriver(),
        google: new MemoryGoogleCloudDriver(),
        firebase: new MemoryFirebaseDriver(),
        sentry: new MemorySentryProjectsDriver(),
      };
  return onboardMobile({ repository: cwd, app, dryRun: !live, ...ports });
}
