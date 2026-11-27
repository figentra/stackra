/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateCommand` on the console: its steps run through the process port as tasks, gen's summary
 *          is drawn as a tree, and a failed step stops the run and shows the tail of its output; `--region` or the
 *          region question places the root runway in the app's own region, the starter's own region (`--yes`,
 *          `--region me` or the question's default) is written on staging and production so the app passes the region
 *          check, and a name that is no region is refused before anything is written.
 * Boundary: test only; the starter is a stub, the folder a temporary one and every child process scripted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1952 spec User Story 1; STA-1966; ADR 0524 (amendment
 *                     2026-11-27, STA-2896).
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MemoryProcessRunnerDriver, runCommandForTest } from "@stackra/console/testing";
import { checkEnvironmentRegion, type RootRunway } from "@stackra/runway";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { parse } from "yaml";

import { CreateCommand } from "#node/commands/create.command";

const encoder = new TextEncoder();

vi.mock("#node/create/functions/read-starter.function", () => ({
  readStarter: () =>
    new Map<string, Uint8Array>([
      [
        "stackra.starter.yaml",
        encoder.encode("version: 1\nrename: []\nprofiles:\n  minimal:\n    include: ['*']\n"),
      ],
      ["package.json", encoder.encode('{"name":"acme"}')],
      [
        "runway.yaml",
        encoder.encode(
          "product:\n  key: acme\nregions:\n  me:\n    cloud: aws\n    location: me-central-1\nenvironments:\n  staging:\n    regions: [me]\n  production:\n    regions: [me]\n",
        ),
      ],
    ]),
}));

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-create-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const argv = ["create", "app", "--starter", "starter", "--yes", "--no-doctor"];

/** Writing the files only: no install, gen or commit. */
const filesOnly = ["--no-install", "--no-git"];

/** The created app's root runway. */
const runwayOf = () => readFileSync(join(root, "app", "runway.yaml"), "utf8");

/**
 * The region findings of the created app's root runway (`runway validate`); the stub starter's runway holds only
 * what the check reads.
 */
const regionIssuesOf = () => checkEnvironmentRegion(parse(runwayOf()) as RootRunway);

/** The answers to the name, scope, edition and package manager questions, as flags. */
const answered = ["--name", "app", "--scope", "@app", "--edition", "free", "--pm", "pnpm"];

describe("CreateCommand", () => {
  it("runs install, gen, type-check and tests as process steps and draws gen's files as a tree", async () => {
    const process = new MemoryProcessRunnerDriver()
      .on("pnpm install")
      .on("pnpm exec stackra gen", {
        output:
          "wrote services/example/stackra.manifest.json\nwrote services/example/.stackra/gen/wiring.ts\n",
      })
      .on("pnpm run typecheck")
      .on("pnpm run test")
      .on("git init -q")
      .on("git add -A")
      .on("git commit -q -m chore: create the app with stackra create");
    const result = await runCommandForTest([CreateCommand], argv, { process, cwd: root });
    expect(result.exitCode).toBe(0);
    expect(process.calls.map((call) => call.line)).toEqual([
      "pnpm install",
      "pnpm exec stackra gen",
      "pnpm run typecheck",
      "pnpm run test",
      "git init -q",
      "git add -A",
      "git commit -q -m chore: create the app with stackra create",
    ]);
    expect(process.calls[0]?.cwd).toBe(join(root, "app"));
    expect(result.stdout).toContain("stackra gen wrote 2 files");
    expect(result.stdout).toContain("services/example");
    expect(result.stdout).toContain("the contract");
  });

  it("stops at a failed step and shows the tail of its output", async () => {
    const process = new MemoryProcessRunnerDriver()
      .on("pnpm install")
      .on("pnpm exec stackra gen", { code: 1, output: "gen exploded: no such member\n" });
    const result = await runCommandForTest([CreateCommand], argv, { process, cwd: root });
    expect(result.exitCode).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain("gen exploded: no such member");
    expect(process.calls.map((call) => call.line)).toEqual([
      "pnpm install",
      "pnpm exec stackra gen",
    ]);
  });

  it("places staging and production in --region, and in the starter's region under --yes", async () => {
    const placed = await runCommandForTest(
      [CreateCommand],
      [...argv, ...filesOnly, "--region", "us-east-1"],
      { cwd: root },
    );
    expect(placed.exitCode).toBe(0);
    expect(runwayOf()).toContain("  staging:\n    region: us-east-1\n    regions: [us-east-1]");
    expect(runwayOf()).toContain("  us-east-1:\n    cloud: aws\n    location: us-east-1");
    expect(runwayOf()).not.toContain("me-central-1");

    rmSync(join(root, "app"), { recursive: true });
    const kept = await runCommandForTest([CreateCommand], [...argv, ...filesOnly], { cwd: root });
    expect(kept.exitCode).toBe(0);
    expect(runwayOf()).toContain("  me:\n    cloud: aws\n    location: me-central-1");
    expect(runwayOf()).toContain("  staging:\n    region: me\n    regions: [me]");
    expect(runwayOf()).toContain("  production:\n    region: me\n    regions: [me]");
    expect(regionIssuesOf()).toEqual([]);
  });

  it("writes --region naming the starter's own region on staging and production", async () => {
    const result = await runCommandForTest(
      [CreateCommand],
      [...argv, ...filesOnly, "--region", "me"],
      { cwd: root },
    );
    expect(result.exitCode).toBe(0);
    expect(runwayOf()).toContain("  staging:\n    region: me\n    regions: [me]");
    expect(runwayOf()).toContain("  production:\n    region: me\n    regions: [me]");
    expect(runwayOf()).toContain("location: me-central-1");
    expect(regionIssuesOf()).toEqual([]);
  });

  it("writes the question's default, the starter's region, on staging and production", async () => {
    // No terminal: the question takes its default, as Enter does.
    const result = await runCommandForTest(
      [CreateCommand],
      ["create", "app", "--starter", "starter", "--no-doctor", ...filesOnly, ...answered],
      { cwd: root },
    );
    expect(result.exitCode).toBe(0);
    expect(runwayOf()).toContain("  staging:\n    region: me\n    regions: [me]");
    expect(runwayOf()).toContain("  production:\n    region: me\n    regions: [me]");
    expect(regionIssuesOf()).toEqual([]);
  });

  it("asks where staging and production run when nothing says", async () => {
    const result = await runCommandForTest(
      [CreateCommand],
      ["create", "app", "--starter", "starter", "--no-doctor", ...filesOnly, ...answered],
      { cwd: root, answers: ["europe-west1"] },
    );
    expect(result.exitCode).toBe(0);
    expect(runwayOf()).toContain("    region: europe-west1");
    expect(runwayOf()).toContain("    cloud: gcp\n    location: europe-west1");
  });

  it("refuses a --region that is no region before writing anything", async () => {
    const result = await runCommandForTest(
      [CreateCommand],
      [...argv, ...filesOnly, "--region", "us"],
      { cwd: root },
    );
    expect(result.exitCode).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      "--region us is not a region Runway knows",
    );
    expect(existsSync(join(root, "app"))).toBe(false);
  });
});
