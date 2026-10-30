/**
 * Stackra file contract:
 * Purpose: unit tests of `deployProduct`'s mobile path: `mobileOnly` publishes no surface and needs no KV writer, each
 *          build goes through the `eas` driver's submit, and an Android build is held back while Play has no release
 *          (the first upload is by hand) while iOS still submits.
 * Boundary: test only; a temporary product repository with a build manifest, a fake command runner and the memory
 *           Play driver, so nothing reaches EAS or a store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482 (decision 8); spec sta-1623.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { PRODUCT_BUILD_SETTINGS } from "#node/constants/product-build-settings.constant";
import { MemoryPlayConsoleDriver } from "#node/drivers/memory-play-console.driver";
import { deployProduct } from "#node/functions/deploy-product.function";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { MobileStoreAccount } from "#node/types/mobile-store-account.type";

const PACKAGE = "com.figentra.commerce.staff";

const STORES: MobileStoreAccount[] = [
  { store: "app_store", owner: "platform", account: "figentra" },
  { store: "google_play", owner: "platform", account: "figentra" },
];

let repository: string;
let calls: string[];

/** Answers `eas build:view` with the platform the build id names. */
const run: CommandRunner = async (command, args) => {
  calls.push([command, ...args].join(" "));
  if (args[0] === "build:view")
    return JSON.stringify({ platform: String(args[1]).endsWith("android") ? "ANDROID" : "IOS" });
  return "[]";
};

beforeEach(() => {
  calls = [];
  repository = mkdtempSync(join(tmpdir(), "deploy-product-"));
  writeFileSync(
    join(repository, "runway.yaml"),
    JSON.stringify({
      version: 3,
      project: "commerce",
      environments: {},
      mobile: {
        staff: {
          template: "os/mobile@3",
          identity: { ios: { bundleId: PACKAGE }, android: { package: PACKAGE } },
          eas: { channel: "production" },
        },
      },
    }),
  );
  const manifest = join(repository, PRODUCT_BUILD_SETTINGS.manifest);
  mkdirSync(dirname(manifest), { recursive: true });
  writeFileSync(
    manifest,
    JSON.stringify({
      product: "commerce",
      sha: "c".repeat(40),
      version: "1",
      dryRun: false,
      surfaces: {},
      mobile: {
        staff: {
          template: { line: "os/mobile@3", package: "@figentra/os-mobile", version: "3.0.0" },
          dir: ".stackra/mobile/staff",
          capabilities: [],
          packages: {},
          buildIds: ["build-ios", "build-android"],
        },
      },
      skipped: { mobile: [] },
      planned: [],
    }),
  );
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("deployProduct mobile only", () => {
  // @covers sta-1623:FR-008
  it("submits both builds through the eas driver with no KV writer", async () => {
    const play = new MemoryPlayConsoleDriver();
    play.apps.set(PACKAGE, { hasRelease: true });

    const deploy = await deployProduct({
      repository,
      environment: "staging",
      assets: { bucket: "", origin: "" },
      served: [],
      stores: { staff: STORES },
      mobileOnly: true,
      play,
      run,
    });

    expect(deploy.submitted).toEqual({ staff: ["build-ios", "build-android"] });
    expect(deploy.surfaces.written).toEqual([]);
    expect(calls.filter((call) => call.startsWith("eas submit"))).toEqual([
      "eas submit --platform ios --id build-ios --profile production --non-interactive --json",
      "eas submit --platform android --id build-android --profile production --non-interactive --json",
    ]);
  });

  // @covers sta-1623:FR-009
  it("holds the Android build back while Play has no release, and still submits iOS", async () => {
    const play = new MemoryPlayConsoleDriver();
    play.apps.set(PACKAGE, { hasRelease: false });

    const deploy = await deployProduct({
      repository,
      environment: "staging",
      assets: { bucket: "", origin: "" },
      served: [],
      stores: { staff: STORES },
      mobileOnly: true,
      play,
      run,
    });

    expect(deploy.submitted).toEqual({ staff: ["build-ios"] });
    expect(deploy.held?.["staff"]).toContain("no Play release yet");
  });
});
