/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayEvidenceCommand` on the console, in a temporary repository: it writes
 *          `runway-evidence-<environment>-<member>.json` (or without the member) with the repo from
 *          `providers.github`, gives the same evidence as the `--json` data, and refuses a missing target or a short
 *          sha with exit 2 before writing anything.
 * Boundary: test only; no network, git or gh runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0533 (decision 3); STA-2104.
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwayEvidenceCommand } from "#node/commands/runway-evidence.command";

const SHA = "d".repeat(40);

/** A repository whose root runway names its GitHub repo and an all-at-once release. */
function repository(): string {
  const folder = mkdtempSync(join(tmpdir(), "runway-evidence-"));
  writeFileSync(join(folder, "pnpm-workspace.yaml"), "packages: []\n");
  writeFileSync(
    join(folder, "runway.yaml"),
    [
      "version: 3",
      "project: acme",
      "providers:",
      "  github:",
      "    org: acme",
      "    repo: platform",
      "environments:",
      "  production:",
      "    destinations:",
      "      web: cloudflare-workers",
      "release:",
      "  strategy:",
      "    kind: all-at-once",
      "    autoRollback: true",
      "",
    ].join("\n"),
  );
  return folder;
}

const run = (argv: readonly string[], cwd: string) =>
  runCommandForTest([RunwayEvidenceCommand], ["evidence", ...argv], { cwd });

describe(RunwayEvidenceCommand, () => {
  /** The file the bot reads is named for the environment and member, and holds what --json gives. */
  it("writes the evidence file the bot reads and gives it as --json data", async () => {
    const cwd = repository();

    const result = await run(
      ["production", "--target", "cloudflare-workers", "--member", "docs", "--sha", SHA, "--json"],
      cwd,
    );

    expect(result.exitCode).toBe(0);
    const written = JSON.parse(
      readFileSync(join(cwd, "runway-evidence-production-docs.json"), "utf8"),
    );
    expect(written).toMatchObject({
      schema: "runway.evidence/v1",
      repo: "acme/platform",
      sha: SHA,
      member: "docs",
      rollout: false,
      destructive: null,
    });
    expect((result.json as { data: unknown }).data).toEqual(written);
  });

  /** Without a member the file is named for the environment only. */
  it("names the file for the environment when no member is given", async () => {
    const cwd = repository();

    expect(
      (await run(["production", "--target", "encore-cloud", "--sha", SHA], cwd)).exitCode,
    ).toBe(0);
    expect(existsSync(join(cwd, "runway-evidence-production.json"))).toBe(true);
  });

  /** A job must name its target and its full commit; nothing is written otherwise. */
  it("refuses a missing target or a short sha with exit 2", async () => {
    const cwd = repository();

    expect((await run(["production", "--sha", SHA], cwd)).exitCode).toBe(2);
    expect((await run(["production", "--target", "eas", "--sha", "abc123"], cwd)).exitCode).toBe(2);
    expect(existsSync(join(cwd, "runway-evidence-production.json"))).toBe(false);
  });
});
