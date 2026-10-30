/**
 * Stackra file contract:
 * Purpose: `runMobileOnboard(context)`, the run of `stackra mobile onboard [--app <key>] [--check|--live]` at a product
 *          root: onboards one mobile app (Runway's `onboardMobile`) and prints every step with its state and the
 *          owner's steps left. The default is an offline plan: the memory drivers start empty, so it reads no secret,
 *          calls no store and plans every step as if nothing existed. `--check` reads the real stores and plans only
 *          what is missing; `--live` makes the changes. Both run only in GitHub Actions, where the keys are.
 * Boundary: chooses the drivers and prints; the steps are Runway's. `--app` defaults to the only app of the runway's
 *           `mobile`. Exit 0 when every step is done or planned, 3 while one is manual or blocked (2 is a usage
 *           error).
 * Runtime: node
 * Governing contract: ADR 0482 (decisions 1 and 9), ADR 0480 (decision 5: live only in CI).
 */
import { join } from "node:path";

import {
  AscAppleDeveloperDriver,
  ExpoGraphqlProjectsDriver,
  FirebaseManagementDriver,
  GoogleCloudDriver,
  GooglePlayConsoleDriver,
  InfisicalVaultWriterDriver,
  MemoryAppleDeveloperDriver,
  MemoryExpoProjectsDriver,
  MemoryFirebaseDriver,
  MemoryGoogleCloudDriver,
  MemoryPlayConsoleDriver,
  MemorySentryProjectsDriver,
  MemoryVaultWriterDriver,
  onboardMobile,
  readRunway,
  SentryApiProjectsDriver,
} from "@stackra/runway/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliContext } from "#node/types/cli-context.type";

/** The mark printed before each state. */
const MARK: Readonly<Record<string, string>> = {
  done: "✓",
  planned: "→",
  manual: "!",
  blocked: "·",
};

/**
 * Onboards one mobile app and resolves with the exit code.
 *
 * @throws CliUsageError when the app is not named and the runway has several, or `--live` runs outside CI.
 * @example
 * await runMobileOnboard({ ...context, values: { app: "academorix" } });
 */
export async function runMobileOnboard(context: CliContext): Promise<number> {
  const { cwd, io, values } = context;
  const live = values["live"] === true;
  const real = live || values["check"] === true;
  if (live && values["check"] === true) throw new CliUsageError("pass --check or --live, not both");
  if (real && process.env["GITHUB_ACTIONS"] !== "true")
    throw new CliUsageError(
      "--check and --live run only in GitHub Actions (the product's production environment); run without them for an offline plan",
    );
  const apps = Object.keys(readRunway(join(cwd, "runway.yaml"), "root").mobile ?? {});
  const named = values["app"];
  const app = typeof named === "string" ? named : apps.length === 1 ? apps[0] : undefined;
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
        vault: new InfisicalVaultWriterDriver(),
      }
    : {
        apple: new MemoryAppleDeveloperDriver(),
        play: new MemoryPlayConsoleDriver(),
        expo: new MemoryExpoProjectsDriver(),
        google: new MemoryGoogleCloudDriver(),
        firebase: new MemoryFirebaseDriver(),
        sentry: new MemorySentryProjectsDriver(),
        vault: new MemoryVaultWriterDriver(),
      };
  const result = await onboardMobile({ repository: cwd, app, dryRun: !live, ...ports });

  io.out(
    `mobile onboard ${app}${live ? "" : real ? " (check: read only, nothing written)" : " (offline plan: nothing is called or written)"}: ${result.ids.bundleId} / ${result.ids.packageName}\n`,
  );
  for (const step of result.steps)
    io.out(
      `${MARK[step.state] ?? "?"} ${step.key.padEnd(17)} ${step.state.padEnd(8)} ${step.detail}\n`,
    );
  const owner = result.steps.filter((step) => step.manual !== undefined);
  if (owner.length > 0) {
    io.out("\nleft for the owner:\n");
    for (const step of owner) {
      io.out(`  ${step.key}\n`);
      for (const line of step.manual ?? []) io.out(`    - ${line}\n`);
    }
  }
  for (const file of result.written) io.out(`wrote ${file}\n`);
  return result.steps.some((step) => step.state === "manual" || step.state === "blocked") ? 3 : 0;
}
