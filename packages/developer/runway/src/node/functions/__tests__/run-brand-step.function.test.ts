/**
 * Stackra file contract:
 * Purpose: unit tests of `runBrandStep` and `committedBrandOutputs`: a merge run builds every web surface (not `ops`)
 *          and every mobile app with its kind's outputs under `.stackra/brand`, passes the parent kit and `--check`,
 *          and skips the git check in check mode; a white-label run builds one app's icons and splash for one scope
 *          from its kit folder; an app without white-label, an unsafe scope id or kit folder, and a runway with
 *          nothing to brand are refused; a committed generated file or manifest fails the step; a missing manifest
 *          is unresolved.
 * Boundary: test only; runs in a temporary folder with a fake command runner, so nothing reaches the kit or git.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended: D17); ADR 0439 (decision 8).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { committedBrandOutputs } from "#node/functions/committed-brand-outputs.function";
import { runBrandStep } from "#node/functions/run-brand-step.function";
import type { CommandRunner } from "#node/types/command-runner.type";

const APP = {
  template: "os/mobile@3",
  identity: { name: { en: "Shopper" }, ios: { bundleId: "com.figentra.commerce.shopper" } },
  eas: { channel: "production" },
  whiteLabel: { modes: ["managed"] },
};

let repository: string;
let calls: { command: string; args: readonly string[] }[];
let tracked: string;

/** Records every call; `git ls-files` answers `tracked`. */
const run: CommandRunner = async (command, args) => {
  calls.push({ command, args });
  return command === "git" ? tracked : "";
};

/** Writes the root runway with `extra` blocks. */
function writeRoot(extra: Record<string, unknown>): void {
  writeFileSync(
    join(repository, "runway.yaml"),
    JSON.stringify({ version: 3, project: "commerce", environments: {}, ...extra }),
  );
}

/** Writes the asset manifest a write run leaves in `outDir`. */
function writeManifest(outDir: string, paths: string[]): void {
  mkdirSync(join(repository, outDir), { recursive: true });
  writeFileSync(
    join(repository, outDir, "asset-manifest.json"),
    JSON.stringify({ kit: "commerce", inputHash: "x", files: paths.map((path) => ({ path })) }),
  );
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
  tracked = "";
  repository = mkdtempSync(join(tmpdir(), "stackra-brand-step-"));
  writeRoot({
    surfaces: {
      console: { shell: "os/console@3", host: "console.commerce" },
      ops: { contributes: "@figentra/commerce-ops-ui" },
    },
    mobile: { shopper: APP },
  });
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("runBrandStep", () => {
  it("checks every web surface and mobile app with its kind's outputs, without the git check", async () => {
    const runs = await runBrandStep({ repository, check: true, parentKitDir: "../os/brand", run });
    expect(runs.map((entry) => entry.outDir)).toEqual([
      ".stackra/brand/web/console",
      ".stackra/brand/mobile/shopper",
    ]);
    expect(calls.map((call) => call.command)).toEqual(["stackra-brand-kit", "stackra-brand-kit"]);
    expect(calls[0]?.args).toEqual([
      "--root",
      ".",
      "--out-dir",
      ".stackra/brand/web/console",
      "--outputs",
      "tokens,heroui_css,favicon,web_manifest",
      "--parent-kit-dir",
      "../os/brand",
      "--check",
    ]);
    expect(calls[1]?.args).toContain("tokens,app_icon,adaptive_icon,splash,store_frame");
  });

  it("writes, then asks git about every generated file and manifest", async () => {
    writeManifest(".stackra/brand/web/console", ["favicon.ico"]);
    writeManifest(".stackra/brand/mobile/shopper", ["ios/icon.png"]);
    await runBrandStep({ repository, run });
    const git = calls.find((call) => call.command === "git");
    expect(git?.args).toEqual([
      "ls-files",
      "-z",
      "--",
      ".stackra/brand/web/console/asset-manifest.json",
      ".stackra/brand/web/console/favicon.ico",
      ".stackra/brand/mobile/shopper/asset-manifest.json",
      ".stackra/brand/mobile/shopper/ios/icon.png",
    ]);
  });

  it("fails when a generated output is committed", async () => {
    writeManifest(".stackra/brand/web/console", ["favicon.ico"]);
    writeManifest(".stackra/brand/mobile/shopper", []);
    tracked = ".stackra/brand/web/console/favicon.ico\0";
    expect(await issuePaths(runBrandStep({ repository, run }))).toEqual([
      ".stackra/brand/web/console/favicon.ico",
    ]);
  });

  it("builds one app's icons and splash for one scope from its kit", async () => {
    writeManifest(".stackra/brand/scopes/sc_42/shopper", ["splash.png"]);
    const runs = await runBrandStep({
      repository,
      variant: { app: "shopper", scope: "sc_42", kitDir: ".stackra/scope-kits/sc_42" },
      run,
    });
    expect(runs).toEqual([
      {
        surface: "shopper",
        scope: "sc_42",
        outDir: ".stackra/brand/scopes/sc_42/shopper",
        outputs: ["app_icon", "adaptive_icon", "splash"],
      },
    ]);
    expect(calls[0]?.args).toContain("--kit-dir");
    expect(calls[0]?.args).toContain(".stackra/scope-kits/sc_42");
  });

  it("refuses an app without white-label, an unsafe scope id and a kit folder outside", async () => {
    writeRoot({ mobile: { shopper: { ...APP, whiteLabel: undefined } } });
    const paths = await issuePaths(
      runBrandStep({ repository, variant: { app: "shopper", scope: "../x", kitDir: "/etc" }, run }),
    );
    expect(paths).toEqual(["mobile.shopper.whiteLabel", "variant.scope", "variant.kitDir"]);
  });

  it("refuses a runway with only the ops surface", async () => {
    writeRoot({ surfaces: { ops: { contributes: "@figentra/commerce-ops-ui" } } });
    expect(await issuePaths(runBrandStep({ repository, run }))).toEqual(["surfaces"]);
  });
});

describe("committedBrandOutputs", () => {
  it("is unresolved when a run's manifest is missing", async () => {
    await expect(
      committedBrandOutputs(
        repository,
        [{ surface: "console", outDir: ".stackra/brand/web/console", outputs: [] }],
        run,
      ),
    ).rejects.toBeInstanceOf(RunwayUnresolvedError);
  });

  it("answers nothing for no runs", async () => {
    expect(await committedBrandOutputs(repository, [], run)).toEqual([]);
    expect(calls).toEqual([]);
  });
});
