/**
 * Stackra file contract:
 * Purpose: unit tests of `migrationRelease`: `--release` first, then `STACKRA_RELEASE`, then the commit of a real git
 *          checkout, and nothing outside a checkout or when git cannot run (STA-1406).
 * Boundary: test only; the checkout is a temporary git repository with one commit, run through a process runner over
 *           `execFileSync`; no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 3); STA-1406.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { CommandIo } from "@stackra/console";
import { afterAll, describe, expect, it } from "@stackra/testing";

import { migrationRelease } from "#node/functions/migration-release.function";

/**
 * A process runner that runs the real program, answering its exit code and output as `io.process` does; git never looks
 * above the temporary folder, so a folder there is outside any checkout wherever the tests run.
 */
const real: CommandIo["process"] = {
  run: async (command, args, options) => {
    try {
      const output = execFileSync(command, [...args], {
        cwd: options?.cwd,
        env: { ...process.env, GIT_CEILING_DIRECTORIES: tmpdir() },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { code: 0, output };
    } catch (error) {
      return { code: (error as { status?: number }).status ?? 1, output: "" };
    }
  },
};

const folders: string[] = [];

afterAll(() => {
  for (const path of folders) rmSync(path, { recursive: true, force: true });
});

/** A fresh folder outside any repository. */
function folder(): string {
  const path = mkdtempSync(join(tmpdir(), "stackra-release-"));
  folders.push(path);
  return path;
}

/** A git checkout with one commit; returns its folder and the commit. */
function checkout(): { readonly cwd: string; readonly commit: string } {
  const cwd = folder();
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  git("init", "--quiet");
  git(
    "-c",
    "user.name=test",
    "-c",
    "user.email=test@example.com",
    "commit",
    "--quiet",
    "--allow-empty",
    "-m",
    "release",
  );
  return { cwd, commit: git("rev-parse", "HEAD").trim() };
}

describe("migrationRelease", () => {
  it("names the checkout's commit when neither --release nor STACKRA_RELEASE is given", async () => {
    const { cwd, commit } = checkout();
    expect(await migrationRelease(undefined, { cwd, process: real }, {})).toBe(commit);
  });

  it("prefers --release, then STACKRA_RELEASE, over the commit", async () => {
    const { cwd } = checkout();
    const env = { STACKRA_RELEASE: " 2026.11.27-1 " };
    expect(await migrationRelease("v1.4.0", { cwd, process: real }, env)).toBe("v1.4.0");
    expect(await migrationRelease("", { cwd, process: real }, env)).toBe("2026.11.27-1");
  });

  it("names nothing outside a git checkout", async () => {
    const cwd = folder();
    expect(await migrationRelease(undefined, { cwd, process: real }, {})).toBeUndefined();
  });

  it("names nothing when git cannot run", async () => {
    const broken: CommandIo["process"] = {
      run: async () => {
        throw new Error("spawn git ENOENT");
      },
    };
    expect(
      await migrationRelease(undefined, { cwd: "/work", process: broken }, {}),
    ).toBeUndefined();
  });
});
