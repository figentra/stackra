/**
 * Stackra file contract:
 * Purpose: unit tests of `RUNWAY_COMMANDS` on the console, in a temporary repository: plan prints JSON and gives it
 *          as the `--json` data; deploy and promote hand their words to the dispatcher with `--dry-run`; drift exits
 *          1 when a Worker drifted; secrets sync passes its environment and dry run; validate exits 0 on clean files
 *          and 1 with each finding; status reads one deployment record per environment; a missing command or
 *          argument is a usage error (exit 2).
 * Boundary: test only; each command's dispatcher, drift reader, sync or GitHub reader is replaced through its field,
 *           so no git, gh, wrangler or infisical runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352; ADR 0506 (decision 8); STA-2100.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { CommandClass } from "@stackra/console";
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunwayDeployCommand } from "#node/commands/runway-deploy.command";
import { RunwayDriftCommand } from "#node/commands/runway-drift.command";
import { RunwayPromoteCommand } from "#node/commands/runway-promote.command";
import { RunwaySecretsSyncCommand } from "#node/commands/runway-secrets-sync.command";
import { RunwayStatusCommand } from "#node/commands/runway-status.command";
import { RUNWAY_COMMANDS } from "#node/constants/runway-commands.constant";

const SHA = "a".repeat(40);

const ROOT = [
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
  "",
].join("\n");

/** A repository with `root` as its root runway and one app member runway. */
function repository(root = ROOT): string {
  const folder = mkdtempSync(join(tmpdir(), "runway-commands-"));
  writeFileSync(join(folder, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
  writeFileSync(join(folder, "runway.yaml"), root);
  mkdirSync(join(folder, "apps/web"), { recursive: true });
  writeFileSync(join(folder, "apps/web/runway.yaml"), "version: 3\nenvironments: {}\n");
  return folder;
}

const run = (commands: readonly CommandClass[], argv: readonly string[], cwd = repository()) =>
  runCommandForTest(commands, argv, { cwd, requireCommand: true });

describe("RUNWAY_COMMANDS", () => {
  it("plans as JSON, printed and as the --json data", async () => {
    const printed = await run(RUNWAY_COMMANDS, ["plan"]);
    expect(printed.exitCode).toBe(0);
    expect(JSON.parse(printed.stdout)).toMatchObject({ environment: "production" });
    const json = await run(RUNWAY_COMMANDS, ["plan", "production", "--json"]);
    expect((json.json as { data: unknown }).data).toMatchObject({ environment: "production" });
  });

  it("hands deploy and promote their words, with --dry-run", async () => {
    const calls: (readonly string[])[] = [];
    class Deploy extends RunwayDeployCommand {
      override dispatch = (argv: readonly string[]) => {
        calls.push(argv);
      };
    }
    class Promote extends RunwayPromoteCommand {
      override dispatch = (argv: readonly string[]) => {
        calls.push(argv);
      };
    }
    expect((await run([Deploy], ["deploy", "cloudflare-workers", "--dry-run"])).exitCode).toBe(0);
    expect((await run([Promote], ["promote", SHA])).exitCode).toBe(0);
    expect(calls).toEqual([
      ["deploy", "cloudflare-workers", "--dry-run"],
      ["promote", SHA],
    ]);
  });

  it("refuses a missing command or argument with exit 2", async () => {
    expect((await run(RUNWAY_COMMANDS, [])).exitCode).toBe(2);
    expect((await run(RUNWAY_COMMANDS, ["deploy"])).exitCode).toBe(2);
  });

  it("exits 1 when a Worker drifted, 0 otherwise", async () => {
    let drifted = 0;
    const asked: (readonly string[])[] = [];
    class Drift extends RunwayDriftCommand {
      override read = async (argv: readonly string[]) => {
        asked.push(argv);
        return drifted;
      };
    }
    expect((await run([Drift], ["drift"])).exitCode).toBe(0);
    drifted = 2;
    expect((await run([Drift], ["drift", "staging"])).exitCode).toBe(1);
    expect(asked).toEqual([["production"], ["staging"]]);
  });

  it("syncs an environment's secrets, as a dry run when asked", async () => {
    const synced: unknown[] = [];
    class Sync extends RunwaySecretsSyncCommand {
      override sync = async (input: unknown) => {
        synced.push(input);
      };
    }
    expect((await run([Sync], ["secrets", "sync", "staging", "--dry-run"])).exitCode).toBe(0);
    expect(synced[0]).toMatchObject({ environment: "staging", dryRun: true });
  });

  it("validates: 0 on clean files, 1 with each finding", async () => {
    expect((await run(RUNWAY_COMMANDS, ["validate"])).exitCode).toBe(0);
    const failed = await run(
      RUNWAY_COMMANDS,
      ["validate"],
      repository(`${ROOT}  dev:\n    destinations:\n      services: compose\n`),
    );
    expect(failed.exitCode).toBe(1);
    expect(failed.stderr).toContain("environments.dev.destinations.services");
  });
});

describe("RunwayStatusCommand", () => {
  it("reads the latest deployment and its state for each environment", async () => {
    const asked: string[] = [];
    class Status extends RunwayStatusCommand {
      override api = (path: string): unknown => {
        asked.push(path);
        if (path.includes("/statuses")) return [{ state: "success" }];
        return path.includes("environment=production")
          ? [{ id: 7, sha: SHA, created_at: "2026-11-04T06:00:00Z" }]
          : [];
      };
    }
    const result = await run([Status], ["status", "--json"]);
    expect(result.exitCode).toBe(0);
    const rows = (result.json as { data: readonly Record<string, string>[] }).data;
    expect(rows.find((row) => row["environment"] === "production")).toEqual({
      environment: "production",
      commit: SHA.slice(0, 12),
      at: "2026-11-04T06:00:00Z",
      state: "success",
    });
    expect(rows.find((row) => row["environment"] === "staging")?.["state"]).toBe("none");
    expect(asked).toContain("repos/acme/platform/deployments/7/statuses?per_page=1");
  });
});
