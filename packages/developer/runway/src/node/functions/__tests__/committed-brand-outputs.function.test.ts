/**
 * Stackra file contract:
 * Purpose: unit tests of `committedBrandOutputs`: git is asked about every file each run's asset manifest lists and
 *          the manifests themselves, and each tracked one is an issue, sorted; nothing tracked is no issue; no runs ask
 *          git nothing; a missing manifest or one without a `files` list fails.
 * Boundary: test only; writes manifests in the OS temp directory and fakes the command runner.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (D17).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { committedBrandOutputs } from "#node/functions/committed-brand-outputs.function";
import type { BrandStepRun } from "#node/types/brand-step-run.type";
import type { CommandRunner } from "#node/types/command-runner.type";

let repository: string;

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-runway-brand-"));
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

/** Writes `manifest` as the asset manifest of `outDir`. */
function writeManifest(outDir: string, manifest: unknown): void {
  mkdirSync(join(repository, outDir), { recursive: true });
  writeFileSync(join(repository, outDir, "asset-manifest.json"), JSON.stringify(manifest));
}

/** A write-mode run of `surface` into `outDir`. */
const runOf = (surface: string, outDir: string): BrandStepRun => ({
  surface,
  outDir,
  outputs: ["tokens"],
});

describe("committedBrandOutputs", () => {
  it("asks git about the listed files and manifests, reporting each tracked one", async () => {
    writeManifest(".stackra/brand/web", {
      files: [{ path: "tokens.css" }, { path: "favicon.ico" }, { name: "no path" }, null],
    });
    writeManifest(".stackra/brand/mobile", { files: [{ path: "icon.png" }] });
    const run = vi.fn<CommandRunner>(
      async () => ".stackra/brand/web/tokens.css\0.stackra/brand/mobile/asset-manifest.json\0",
    );

    const issues = await committedBrandOutputs(
      repository,
      [runOf("console", ".stackra/brand/web"), runOf("staff", ".stackra/brand/mobile")],
      run,
    );

    expect(run).toHaveBeenCalledWith(
      "git",
      [
        "ls-files",
        "-z",
        "--",
        ".stackra/brand/web/asset-manifest.json",
        ".stackra/brand/web/tokens.css",
        ".stackra/brand/web/favicon.ico",
        ".stackra/brand/mobile/asset-manifest.json",
        ".stackra/brand/mobile/icon.png",
      ],
      { cwd: repository },
    );
    expect(issues.map((issue) => issue.path)).toEqual([
      ".stackra/brand/mobile/asset-manifest.json",
      ".stackra/brand/web/tokens.css",
    ]);
    expect(issues[0]?.message).toMatch(/git rm --cached/);
  });

  it("answers no issue when git tracks none, and asks nothing without runs", async () => {
    writeManifest(".stackra/brand/web", { files: [{ path: "tokens.css" }] });
    const run = vi.fn<CommandRunner>(async () => "");

    const runs = [runOf("console", ".stackra/brand/web")];

    expect(await committedBrandOutputs(repository, runs, run)).toEqual([]);
    run.mockClear();
    expect(await committedBrandOutputs(repository, [], run)).toEqual([]);
    expect(run).not.toHaveBeenCalled();
  });

  it("fails when a manifest is missing or has no file list", async () => {
    const run = vi.fn<CommandRunner>(async () => "");

    await expect(
      committedBrandOutputs(repository, [runOf("console", ".stackra/brand/web")], run),
    ).rejects.toThrow(/cannot read \.stackra\/brand\/web\/asset-manifest\.json/);

    writeManifest(".stackra/brand/web", { outputs: [] });
    await expect(
      committedBrandOutputs(repository, [runOf("console", ".stackra/brand/web")], run),
    ).rejects.toThrow(RunwayUnresolvedError);
    expect(run).not.toHaveBeenCalled();
  });
});
