/**
 * Stackra file contract:
 * Purpose: unit tests of `runMobileJob`: a merge-started build writes the template checkout's Expo config and
 *          autolinking excludes from the runway app and the capability catalogue and starts `eas build` on the app's
 *          channel; a scope-started white-label build takes the variant identity; a managed white-label iOS build is
 *          refused until 4.2.6 and 4.3 are recorded as passed; an unknown app, a missing store account, a mode the app
 *          does not offer and a variant of an app without white-label are refused; with `line`, the job checks the
 *          template line out from a local source, commits the written config and builds that commit, all through a
 *          dry-run runner.
 * Boundary: test only; runs in a temporary folder with a fake command runner, so nothing reaches git or EAS.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0439 (decisions 2, 3 and 8, and enforcement).
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { dryRunCommand } from "#node/functions/dry-run-command.function";
import { runMobileJob } from "#node/functions/run-mobile-job.function";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { MobileJobRequest } from "#node/types/mobile-job-request.type";
import type { MobileStoreAccount } from "#node/types/mobile-store-account.type";

const SHA = "b".repeat(40);

const MANAGED: MobileStoreAccount[] = [
  { store: "app_store", owner: "platform", account: "figentra" },
  { store: "google_play", owner: "platform", account: "figentra" },
];

const OWN: MobileStoreAccount[] = [
  { store: "app_store", owner: "scope", connection: "conn_asc" },
  { store: "google_play", owner: "scope", connection: "conn_play" },
];

const APP = {
  template: "os/mobile@3",
  store: "assets/store/shopper",
  identity: {
    name: { en: "Commerce" },
    ios: { bundleId: "com.figentra.commerce.shopper" },
    android: { package: "com.figentra.commerce.shopper" },
  },
  capabilities: ["push"],
  stores: { apple: { account: "figentra" }, google: { account: "figentra" } },
  eas: { project: "0f8c2b1e-5d3a-4c7b-9e21-6a4d8f0b3c57", channel: "production" },
  whiteLabel: { modes: ["managed", "bring-your-own"] },
};

let repository: string;
let templateDir: string;
let calls: string[];

/** A runner that answers git with the release commit and eas build with two build ids. */
const run: CommandRunner = async (command, args) => {
  calls.push([command, ...args].join(" "));
  if (command === "git") return `${SHA}\n`;
  return JSON.stringify([{ id: "build-ios" }, { id: "build-android" }]);
};

/** Writes the root runway with `mobile.shopper` set to `app`. */
function writeRoot(app: unknown): void {
  writeFileSync(
    join(repository, "runway.yaml"),
    JSON.stringify({ version: 3, project: "commerce", environments: {}, mobile: { shopper: app } }),
  );
}

/** A request for the shopper app with `overrides`. */
function request(overrides: Partial<MobileJobRequest> = {}): MobileJobRequest {
  return {
    repository,
    app: "shopper",
    templateDir,
    sha: SHA,
    environment: "production",
    stores: MANAGED,
    run,
    ...overrides,
  };
}

/** The paths of the RunwayInvalidError `promise` rejects with. */
async function issuePaths(promise: Promise<unknown>): Promise<string[]> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof RunwayInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  throw new Error("expected a RunwayInvalidError");
}

beforeEach(() => {
  calls = [];
  repository = mkdtempSync(join(tmpdir(), "stackra-mobile-job-"));
  templateDir = join(repository, ".stackra", "mobile");
  mkdirSync(templateDir, { recursive: true });
  writeRoot(APP);
  writeFileSync(
    join(templateDir, "app.json"),
    JSON.stringify({
      expo: {
        name: "Template",
        slug: "template",
        plugins: ["expo-router"],
        ios: { infoPlist: { NSCameraUsageDescription: "Scan" } },
      },
    }),
  );
  writeFileSync(
    join(templateDir, "capabilities.json"),
    JSON.stringify({
      push: { modules: ["expo-notifications"], plugins: ["expo-notifications"] },
      scanner: {
        modules: ["expo-camera"],
        plugins: ["expo-camera"],
        ios: { infoPlist: ["NSCameraUsageDescription"] },
        android: { permissions: ["android.permission.CAMERA"] },
      },
    }),
  );
  writeFileSync(
    join(templateDir, "package.json"),
    JSON.stringify({ name: "mobile", expo: { autolinking: { exclude: ["expo-dev-menu"] } } }),
  );
});

afterEach(() => rmSync(repository, { recursive: true, force: true }));

describe("runMobileJob", () => {
  it("writes the Expo config and starts the EAS build of a merge-started app", async () => {
    const result = await runMobileJob(request());

    const appJson = JSON.parse(readFileSync(join(templateDir, "app.json"), "utf8"));
    expect(appJson.expo.plugins).toEqual(["expo-router", "expo-notifications"]);
    expect(appJson.expo.ios.infoPlist).toEqual({});
    expect(appJson.expo.ios.bundleIdentifier).toBe("com.figentra.commerce.shopper");
    expect(appJson.expo.android.blockedPermissions).toEqual([
      "android.permission.CAMERA",
      "com.google.android.gms.permission.AD_ID",
    ]);
    const manifest = JSON.parse(readFileSync(join(templateDir, "package.json"), "utf8"));
    expect(manifest.expo.autolinking.exclude).toEqual(["expo-dev-menu", "expo-camera"]);

    expect(calls).toEqual([
      "git rev-parse HEAD",
      "eas build --profile production --platform all --non-interactive --no-wait --json",
    ]);
    expect(result.record).toEqual({
      target: "production/mobile/shopper",
      sha: SHA,
      reference: "build-ios,build-android",
    });
    expect(result.scope).toBeUndefined();
    expect(result.stores).toEqual(MANAGED);
  });

  it("builds a scope's white-label variant under its own store accounts", async () => {
    const result = await runMobileJob(
      request({
        stores: OWN,
        variant: {
          scope: "scope_42",
          identity: {
            name: { en: "Acme" },
            ios: { bundleId: "com.acme.shop" },
            android: { package: "com.acme.shop" },
          },
        },
      }),
    );
    expect(result.scope).toBe("scope_42");
    expect(result.record.target).toBe("production/mobile/shopper/scope:scope_42");
    expect(result.config["name"]).toBe("Acme");
  });

  it("refuses a managed white-label iOS build until 4.2.6 and 4.3 are recorded as passed", async () => {
    const variant = { scope: "scope_42", identity: { name: { en: "Acme" } } };
    await expect(runMobileJob(request({ variant }))).rejects.toThrow(RunwayUnresolvedError);
    expect(calls).toEqual([]);

    mkdirSync(join(repository, "assets/store/shopper"), { recursive: true });
    const record = join(repository, "assets/store/shopper/apple-guidelines.json");
    writeFileSync(
      record,
      JSON.stringify({ "4.2.6": { result: "pass" }, "4.3": { result: "open" } }),
    );
    await expect(runMobileJob(request({ variant }))).rejects.toThrow(/4\.3/);

    writeFileSync(
      record,
      JSON.stringify({ "4.2.6": { result: "pass" }, "4.3": { result: "pass" } }),
    );
    expect((await runMobileJob(request({ variant }))).scope).toBe("scope_42");
  });

  it("refuses an unknown app, a missing store account, an offered-mode gap and a variant without white-label", async () => {
    expect(await issuePaths(runMobileJob(request({ app: "staff" })))).toEqual(["mobile.staff"]);
    expect(await issuePaths(runMobileJob(request({ stores: MANAGED.slice(0, 1) })))).toEqual([
      "mobile.shopper.stores",
    ]);

    writeRoot({ ...APP, whiteLabel: { modes: ["managed"] } });
    const variant = { scope: "scope_42", identity: {} };
    expect(await issuePaths(runMobileJob(request({ stores: OWN, variant })))).toEqual([
      "mobile.shopper.whiteLabel.modes",
      "mobile.shopper.whiteLabel.modes",
    ]);

    const { whiteLabel: _, ...plain } = APP;
    writeRoot(plain);
    expect(await issuePaths(runMobileJob(request({ stores: OWN, variant })))).toEqual([
      "mobile.shopper.whiteLabel",
    ]);
  });

  it("checks the template line out, commits the written config and builds that commit", async () => {
    const local = join(repository, "os-mobile");
    mkdirSync(local);
    for (const file of ["app.json", "capabilities.json"])
      writeFileSync(join(local, file), readFileSync(join(templateDir, file)));
    writeFileSync(
      join(local, "package.json"),
      JSON.stringify({ name: "@figentra/os-mobile", version: "3.1.0" }),
    );
    const into = join(repository, ".stackra", "line");
    const dry = dryRunCommand({ head: SHA });

    const { sha: _, ...job } = request({
      templateDir: into,
      line: { scope: "@figentra", local },
      run: dry,
    });
    const result = await runMobileJob(job);

    expect(result.template).toMatchObject({
      package: "@figentra/os-mobile",
      version: "3.1.0",
      from: "local",
      sha: SHA,
    });
    const appJson = JSON.parse(readFileSync(join(into, "app.json"), "utf8"));
    expect(appJson.expo.extra.capabilities).toEqual(["push"]);
    expect(JSON.parse(readFileSync(join(into, "package.json"), "utf8")).expo.autolinking).toEqual({
      exclude: ["expo-camera"],
    });
    expect(dry.calls.map((call) => [call.command, call.args[0]])).toEqual([
      ["git", "init"],
      ["git", "add"],
      ["git", "-c"],
      ["git", "rev-parse"],
      ["git", "add"],
      ["git", "-c"],
      ["git", "rev-parse"],
      ["git", "rev-parse"],
      ["eas", "build"],
    ]);
    expect(result.record.sha).toBe(SHA);
  });

  it("refuses a job with neither a commit nor a line", async () => {
    const { sha: _, ...job } = request();
    expect(await issuePaths(runMobileJob(job))).toEqual(["sha"]);
  });
});
