/**
 * Stackra file contract:
 * Purpose: unit tests of `PromoteCommand` on the console: it refuses a missing or unknown environment (exit 2),
 *          refuses a `--to` that does not deploy on promotion even on a dry run (exit 1), lists the targets on a dry
 *          run as the `--json` data (noting one without a provider), refuses an approval-gated environment without
 *          `--approved` (exit 2), and hands Runway's `promote()` both environments, the providers and the commit, then
 *          draws each record.
 * Boundary: test only; Runway's `readRunway` and `promote` are mocked, nothing is deployed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352; ADR 0468; STA-607; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { promote } from "@stackra/runway";
import type { RootRunway } from "@stackra/runway";
import { readRunway } from "@stackra/runway/node";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PromoteCommand } from "#node/commands/promote.command";

vi.mock("@stackra/runway", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  promote: vi.fn(),
}));

vi.mock("@stackra/runway/node", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  readRunway: vi.fn(),
}));

const SHA = "d".repeat(40);

const ROOT = {
  project: "core",
  providers: {},
  environments: {
    staging: { destinations: { docs: "mintlify" } },
    production: {
      destinations: { services: "encore-cloud", docs: "mintlify" },
      deploy: { on: "promote", approval: "github-environment" },
    },
  },
  targets: { mintlify: { branch: "docs-site" } },
} as unknown as RootRunway;

const run = (...argv: string[]) => runCommandForTest([PromoteCommand], ["promote", ...argv]);

beforeEach(() => {
  vi.mocked(readRunway).mockReset().mockReturnValue(ROOT);
  vi.mocked(promote)
    .mockReset()
    .mockResolvedValue([
      {
        record: { target: "production/docs", sha: SHA, reference: "" },
        report: { status: "up" },
      },
    ] as never);
});

describe("PromoteCommand", () => {
  it("refuses a missing or unknown environment with exit 2", async () => {
    const missing = await run();
    expect(missing.exitCode).toBe(2);
    expect(missing.stderr).toContain("--to");
    expect((await run("--to", "production", "--from", "qa")).exitCode).toBe(2);
    expect((await run("--to", "qa")).exitCode).toBe(2);
    expect(promote).not.toHaveBeenCalled();
  });

  it("refuses a --to that does not deploy on promotion, on a dry run too", async () => {
    const dry = await run("--to", "staging", "--dry-run");
    expect(dry.exitCode).toBe(1);
    expect(dry.stderr).toContain("staging is not deployed by promotion");
    expect((await run("--to", "staging", "--approved")).exitCode).toBe(1);
    expect(promote).not.toHaveBeenCalled();
  });

  it("lists the targets on a dry run as the --json data, notes one without a provider, and ships nothing", async () => {
    const result = await run("--to", "production", "--dry-run", "--json");
    expect(result.exitCode).toBe(0);
    expect((result.json as { data: unknown }).data).toEqual([
      { target: "production/services", destination: "encore-cloud", note: "no provider" },
      { target: "production/docs", destination: "mintlify" },
    ]);
    expect(promote).not.toHaveBeenCalled();
  });

  it("refuses an approval-gated environment unless --approved is passed", async () => {
    const result = await run("--to", "production", "--sha", SHA);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain(
      "production is promoted only after its approval (github-environment)",
    );
    expect(promote).not.toHaveBeenCalled();
  });

  it("ships staging to production by default and draws each record", async () => {
    const result = await run("--to", "production", "--sha", SHA, "--approved");
    expect(result.exitCode).toBe(0);
    const [root, from, to, providers, sha] = vi.mocked(promote).mock.calls[0] ?? [];
    expect([root, from, to, sha]).toEqual([ROOT, "staging", "production", SHA]);
    expect(providers?.map((provider) => provider.destination)).toEqual([
      "eas",
      "mintlify",
      "cloudflare-workers",
    ]);
    expect(result.stdout).toContain("production/docs");
    expect(result.stdout).toContain(SHA.slice(0, 12));
    expect(result.stdout).toContain("up");
  });
});
