/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayEnvOrphansCommand` on the console: it reads the environment's scope from `--dir`
 *          (relative to the working folder) at the repository root, warns once per orphan name with where it sits,
 *          says so when there is none, and always exits 0.
 * Boundary: test only; the orphan read is replaced through its field, so no sops file and no OIDC proof is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525; ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwayEnvOrphansCommand } from "#node/commands/runway-env-orphans.command";

/** The command over `found` in a fresh repository; records what it was asked to read. */
async function run(argv: readonly string[], found: { name: string; where: string }[]) {
  const cwd = mkdtempSync(join(tmpdir(), "runway-env-orphans-"));
  writeFileSync(join(cwd, "pnpm-workspace.yaml"), "packages: []\n");
  const asked: unknown[] = [];
  class Orphans extends RunwayEnvOrphansCommand {
    override orphans = async (input: Parameters<RunwayEnvOrphansCommand["orphans"]>[0]) => {
      asked.push(input);
      return found;
    };
  }
  const result = await runCommandForTest([Orphans], ["env:orphans", ...argv], { cwd });
  return { result, asked, cwd };
}

describe(RunwayEnvOrphansCommand, () => {
  /** Each orphan is a warning; the run still passes, since an orphan is a finding, not a failure. */
  it("warns on each orphan name and exits 0", async () => {
    const { result, asked, cwd } = await run(
      ["staging"],
      [{ name: "OLD_KEY", where: "products/acme/staging" }],
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout + result.stderr).toContain(
      "OLD_KEY (products/acme/staging) is in the sops scope but no code declares it",
    );
    expect(asked).toMatchObject([{ environment: "staging", dir: `${cwd}/.secrets` }]);
  });

  /** A clean scope says so. */
  it("says there is no orphan when the scope is clean", async () => {
    const { result } = await run(["production", "--dir", "/ci/secrets"], []);

    expect(result.exitCode).toBe(0);
    expect(result.stdout + result.stderr).toContain("no orphan names in production");
  });
});
