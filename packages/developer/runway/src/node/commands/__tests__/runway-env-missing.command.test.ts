/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayEnvMissingCommand` on the console: it reads the environment's scope from `--dir`
 *          (relative to the working folder) at the repository root, prints each required name the scope lacks as an
 *          error and exits 1, prints an optional one as a warning and exits 0, and says so when nothing is missing.
 * Boundary: test only; the read is replaced through its field, so no sops file and no OIDC proof is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525; ADR 0371 (amendment 2026-11-27); STA-258.
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwayEnvMissingCommand } from "#node/commands/runway-env-missing.command";
import type { EnvFinding } from "#node/types/env-finding.type";

/** The command over `found` in a fresh repository; records what it was asked to read. */
async function run(argv: readonly string[], found: EnvFinding[]) {
  const cwd = mkdtempSync(join(tmpdir(), "runway-env-missing-"));
  writeFileSync(join(cwd, "pnpm-workspace.yaml"), "packages: []\n");
  const asked: unknown[] = [];
  class Missing extends RunwayEnvMissingCommand {
    override missing = async (input: Parameters<RunwayEnvMissingCommand["missing"]>[0]) => {
      asked.push(input);
      return found;
    };
  }
  const result = await runCommandForTest([Missing], ["env:missing", ...argv], { cwd });
  return { result, asked, cwd };
}

describe(RunwayEnvMissingCommand, () => {
  it("fails on a required name the scope lacks", async () => {
    const { result, asked, cwd } = await run(
      ["staging"],
      [
        {
          level: "error",
          name: "STRIPE_SECRET_KEY",
          where: "services/api",
          message: "is not in products/acme/staging: add it",
        },
      ],
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout + result.stderr).toContain(
      "STRIPE_SECRET_KEY (services/api) is not in products/acme/staging: add it",
    );
    expect(asked).toMatchObject([{ environment: "staging", dir: `${cwd}/.secrets` }]);
  });

  it("passes with a warning when only an optional name is absent", async () => {
    const { result } = await run(
      ["production", "--dir", "/ci/secrets"],
      [
        {
          level: "warning",
          name: "SENTRY_DSN",
          where: "services/api",
          message: "is not in products/acme/production: it is optional",
        },
      ],
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout + result.stderr).toContain("SENTRY_DSN (services/api) is not in");
    expect(result.stdout + result.stderr).toContain(
      "production: the scope holds every required secret, 1 optional absent",
    );
  });
});
