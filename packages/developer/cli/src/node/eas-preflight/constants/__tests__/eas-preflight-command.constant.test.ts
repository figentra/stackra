/**
 * Stackra file contract:
 * Purpose: unit tests of `EAS_PREFLIGHT_COMMAND` against a real throwaway git repository: `check` passes on a clean tree at the
 *          deployed sha with room on disk, and refuses a dirty tree, another sha and too little disk with one line each; the
 *          deployed sha comes from `--deployed-sha`, else `STACKRA_DEPLOYED_SHA`, else the head of origin/main; `record` appends
 *          one JSON line to the build record; a missing or unknown command, platform or build id exits 1 with the usage or reason.
 * Boundary: test only; temporary folders, local git, and a fake `statfsSync` so the free disk of the box does not decide the outcome.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0180; ADR 0170; STA-1577.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { EAS_PREFLIGHT_COMMAND } from "#node/eas-preflight/constants/eas-preflight-command.constant";
import { captureIo } from "#node/functions/capture-io.function";
import type { CliContext } from "#node/types/cli-context.type";

const GB = 1024 ** 3;
/** Free bytes the fake disk reports; set per test. */
const disk = vi.hoisted(() => ({ free: 100 * 1024 ** 3 }));

vi.mock("node:fs", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  statfsSync: () => ({ bavail: disk.free, bsize: 1 }),
}));

let repo: string;
let origin: string;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "t",
      GIT_AUTHOR_EMAIL: "t@example.test",
      GIT_COMMITTER_NAME: "t",
      GIT_COMMITTER_EMAIL: "t@example.test",
    },
  }).trim();

beforeEach(() => {
  const work = mkdtempSync(join(tmpdir(), "stackra-eas-preflight-"));
  origin = join(work, "origin.git");
  repo = join(work, "repo");
  disk.free = 100 * GB;
  delete process.env["STACKRA_DEPLOYED_SHA"];
  mkdirSync(repo);
  git(work, "init", "--bare", "--initial-branch=main", origin);
  git(repo, "init", "--initial-branch=main");
  writeFileSync(join(repo, "pnpm-workspace.yaml"), "packages: []\n");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "first");
  git(repo, "remote", "add", "origin", origin);
  git(repo, "push", "--quiet", "origin", "main");
});

afterEach(() => {
  delete process.env["STACKRA_DEPLOYED_SHA"];
  rmSync(join(repo, ".."), { recursive: true, force: true });
});

const run = async (positionals: string[], values: CliContext["values"] = {}) => {
  const { io, output } = captureIo();
  const code = await EAS_PREFLIGHT_COMMAND.run({
    cwd: repo,
    io,
    values,
    positionals,
    rest: [],
    cli: async () => 0,
  });
  return { code, output: output() };
};

describe("EAS_PREFLIGHT_COMMAND check", () => {
  it("passes on a clean tree at the deployed sha with room on disk", async () => {
    const head = git(repo, "rev-parse", "HEAD");
    const { code, output } = await run(["check"], { platform: "ios", "deployed-sha": head });
    expect(code).toBe(0);
    expect(output).toBe(`eas-preflight: ok, ios at ${head}\n`);
  });

  it("reads the deployed sha from the head of origin/main when none is given, and says so", async () => {
    const head = git(repo, "rev-parse", "HEAD");
    const { code, output } = await run(["check"], { platform: "android" });
    expect(code).toBe(0);
    expect(output).toContain(`deployed sha: head of origin/main ${head}`);
    expect(output).toContain(`eas-preflight: ok, android at ${head}`);
  });

  it("takes STACKRA_DEPLOYED_SHA over origin/main", async () => {
    const first = git(repo, "rev-parse", "HEAD");
    writeFileSync(join(repo, "next.txt"), "x");
    git(repo, "add", ".");
    git(repo, "commit", "-m", "second");
    process.env["STACKRA_DEPLOYED_SHA"] = first;
    const { code, output } = await run(["check"], { platform: "android" });
    expect(code).toBe(1);
    expect(output).toContain("is not the deployed sha");
    expect(output).not.toContain("head of origin/main");
  });

  it("refuses a dirty tree, a HEAD that is not the deployed sha and too little disk, one line each", async () => {
    const first = git(repo, "rev-parse", "HEAD");
    writeFileSync(join(repo, "next.txt"), "x");
    git(repo, "add", ".");
    git(repo, "commit", "-m", "second");
    writeFileSync(join(repo, "untracked.txt"), "y");
    disk.free = 5 * GB;
    const { code, output } = await run(["check"], { platform: "ios", "deployed-sha": first });
    expect(code).toBe(1);
    const lines = output.trimEnd().split("\n");
    expect(lines).toHaveLength(3);
    expect(lines.every((line) => line.startsWith("eas-preflight: "))).toBe(true);
    expect(output).toMatch(/uncommitted changes/);
    expect(output).toMatch(/is not the deployed sha/);
    expect(output).toMatch(/needs 25 GB/);
  });

  it("refuses an unknown platform", async () => {
    const head = git(repo, "rev-parse", "HEAD");
    const { code, output } = await run(["check"], { platform: "web", "deployed-sha": head });
    expect(code).toBe(1);
    expect(output).toMatch(/unknown platform/);
  });

  it("reports a deployed sha git does not know as an error, not a crash", async () => {
    const { code, output } = await run(["check"], {
      platform: "ios",
      "deployed-sha": "nonexistent-ref",
    });
    expect(code).toBe(1);
    expect(output.startsWith("eas-preflight: ")).toBe(true);
  });
});

describe("EAS_PREFLIGHT_COMMAND record", () => {
  it("appends one JSON line per build to the record file", async () => {
    const head = git(repo, "rev-parse", "HEAD");
    const first = await run(["record"], {
      platform: "ios",
      "build-id": "b1",
      "rollout-id": "r1",
      profile: "production",
    });
    expect(first).toEqual({ code: 0, output: "recorded in .stackra/releases/eas-builds.jsonl\n" });
    expect((await run(["record"], { platform: "android", "build-id": "b2" })).code).toBe(0);

    const lines = readFileSync(join(repo, ".stackra/releases/eas-builds.jsonl"), "utf8")
      .trimEnd()
      .split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0] ?? "")).toMatchObject({
      platform: "ios",
      profile: "production",
      sha: head,
      buildId: "b1",
      rolloutId: "r1",
    });
    expect(JSON.parse(lines[1] ?? "")).toMatchObject({
      platform: "android",
      profile: null,
      buildId: "b2",
      rolloutId: null,
    });
  });

  it("refuses a missing or unknown platform with the usage, and a missing build id with its reason", async () => {
    for (const values of [{}, { platform: "web", "build-id": "b1" }]) {
      const { code, output } = await run(["record"], values);
      expect(code).toBe(1);
      expect(output).toContain("usage: pnpm eas:preflight");
    }
    const noBuild = await run(["record"], { platform: "ios" });
    expect(noBuild.code).toBe(1);
    expect(noBuild.output).toContain("--build-id is required");
    expect(() => readFileSync(join(repo, ".stackra/releases/eas-builds.jsonl"), "utf8")).toThrow();
  });
});

describe("EAS_PREFLIGHT_COMMAND usage", () => {
  it("exits 1 with the usage for no command or an unknown one", async () => {
    for (const positionals of [[], ["ship"]]) {
      const { code, output } = await run(positionals, { platform: "ios" });
      expect(code).toBe(1);
      expect(output).toContain("eas-preflight: usage: pnpm eas:preflight check");
    }
  });
});
