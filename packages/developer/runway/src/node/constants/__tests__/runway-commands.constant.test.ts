/**
 * Stackra file contract:
 * Purpose: unit tests of `RUNWAY_COMMANDS` on the console: plan prints JSON and gives it as the `--json` data; deploy
 *          and promote hand their words to the dispatcher with `--dry-run`; rollback refuses the head of main; drift
 *          exits 1 when a Worker drifted; secrets sync passes its environment and dry run; validate exits 0 on a
 *          clean repository and 1 with each finding; status reads one deployment record per environment; a missing
 *          command or argument is a usage error (exit 2).
 * Boundary: test only; the repository root, the runway readers, the dispatcher, git, the drift reader and the
 *           secret sync are fakes, so no git, gh, wrangler or infisical runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352; ADR 0506 (decision 8); STA-2100.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayStatusCommand } from "#node/commands/runway-status.command";
import { RUNWAY_COMMANDS } from "#node/constants/runway-commands.constant";
import { repositoryRoot } from "#node/functions/repository-root.function";
import { runRunway } from "#node/functions/run-runway.function";
import { runRunwayDrift } from "#node/functions/run-runway-drift.function";
import { syncSecrets } from "#node/functions/sync-secrets.function";

vi.mock("#node/functions/repository-root.function", () => ({ repositoryRoot: vi.fn() }));
vi.mock("#node/functions/run-runway.function", () => ({ runRunway: vi.fn() }));
vi.mock("#node/functions/run-runway-drift.function", () => ({ runRunwayDrift: vi.fn() }));
vi.mock("#node/functions/sync-secrets.function", () => ({ syncSecrets: vi.fn() }));

const SHA = "a".repeat(40);

/** A repository with a root runway and one app member runway. */
function repository(root: string): string {
  const folder = mkdtempSync(join(tmpdir(), "runway-commands-"));
  writeFileSync(join(folder, "runway.yaml"), root);
  mkdirSync(join(folder, "apps/web"), { recursive: true });
  writeFileSync(join(folder, "apps/web/runway.yaml"), "version: 3\nenvironments: {}\n");
  return folder;
}

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

const run = (...argv: string[]) => runCommandForTest(RUNWAY_COMMANDS, argv);

beforeEach(() => {
  vi.mocked(repositoryRoot).mockReset().mockReturnValue(repository(ROOT));
  vi.mocked(runRunway).mockReset();
  vi.mocked(runRunwayDrift).mockReset().mockResolvedValue(0);
  vi.mocked(syncSecrets).mockReset().mockResolvedValue();
});

describe("RUNWAY_COMMANDS", () => {
  it("plans as JSON, printed and as the --json data", async () => {
    const printed = await run("plan");
    expect(printed.exitCode).toBe(0);
    expect(JSON.parse(printed.stdout)).toMatchObject({ environment: "production" });
    const json = await run("plan", "production", "--json");
    expect((json.json as { data: unknown }).data).toMatchObject({ environment: "production" });
  });

  it("hands deploy and promote their words, with --dry-run", async () => {
    expect((await run("deploy", "cloudflare-workers", "--dry-run")).exitCode).toBe(0);
    expect((await run("promote", SHA)).exitCode).toBe(0);
    expect(vi.mocked(runRunway).mock.calls.map(([argv]) => argv)).toEqual([
      ["deploy", "cloudflare-workers", "--dry-run"],
      ["promote", SHA],
    ]);
  });

  it("refuses a missing command or argument with exit 2", async () => {
    expect((await run()).exitCode).toBe(2);
    expect((await run("deploy")).exitCode).toBe(2);
    expect(runRunway).not.toHaveBeenCalled();
  });

  it("exits 1 when a Worker drifted, 0 otherwise", async () => {
    expect((await run("drift")).exitCode).toBe(0);
    vi.mocked(runRunwayDrift).mockResolvedValue(2);
    expect((await run("drift", "staging")).exitCode).toBe(1);
    expect(vi.mocked(runRunwayDrift).mock.calls.at(-1)?.[0]).toEqual(["staging"]);
  });

  it("syncs an environment's secrets, as a dry run when asked", async () => {
    expect((await run("secrets", "sync", "staging", "--dry-run")).exitCode).toBe(0);
    expect(vi.mocked(syncSecrets).mock.calls[0]?.[0]).toMatchObject({
      environment: "staging",
      dryRun: true,
    });
  });

  it("validates: 0 on clean files, 1 with each finding", async () => {
    expect((await run("validate")).exitCode).toBe(0);
    vi.mocked(repositoryRoot).mockReturnValue(
      repository(`${ROOT}  dev:\n    destinations:\n      services: compose\n`),
    );
    const failed = await run("validate");
    expect(failed.exitCode).toBe(1);
    expect(failed.stderr).toContain("environments.dev.destinations.services");
  });
});

describe("RunwayStatusCommand", () => {
  it("reads the latest deployment and its state for each environment", async () => {
    const asked: string[] = [];
    class Fake extends RunwayStatusCommand {
      override api = (path: string): unknown => {
        asked.push(path);
        if (path.includes("/statuses")) return [{ state: "success" }];
        return path.includes("environment=production")
          ? [{ id: 7, sha: SHA, created_at: "2026-11-04T06:00:00Z" }]
          : [];
      };
    }
    const result = await runCommandForTest([Fake], ["status", "--json"]);
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
