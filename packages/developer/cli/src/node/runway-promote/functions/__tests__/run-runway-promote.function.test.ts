/**
 * Stackra file contract:
 * Purpose: unit tests of `stackra promote`: it refuses a missing environment, lists the targets on a dry run, refuses
 *          an approval-gated environment without `--approved`, and hands Runway's `promote()` both environments, the
 *          providers and the commit, then reports each record.
 * Boundary: test only; Runway's `readRunway` and `promote` are mocked, nothing is deployed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352; STA-607.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { promote } from "@stackra/runway";
import type { RootRunway } from "@stackra/runway";
import { readRunway } from "@stackra/runway/node";
import { vi } from "vitest";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { runRunwayPromote } from "#node/runway-promote/functions/run-runway-promote.function";
import type { CliContext } from "#node/types/cli-context.type";

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
      destinations: { docs: "mintlify" },
      deploy: { on: "promote", approval: "github-environment" },
    },
  },
  targets: { mintlify: { branch: "docs-site" } },
} as unknown as RootRunway;

const run = (values: CliContext["values"]) => {
  const { io, output } = captureIo();
  const code = runRunwayPromote({
    cwd: ".",
    io,
    values,
    positionals: [],
    rest: [],
    cli: async () => 0,
  });
  return { code, output };
};

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

describe("runRunwayPromote", () => {
  it("refuses a missing or unknown environment", async () => {
    await expect(run({}).code).rejects.toThrow(CliUsageError);
    await expect(run({ to: "production", from: "qa" }).code).rejects.toThrow(/--from/);
  });

  it("lists the targets on a dry run and ships nothing", async () => {
    const { code, output } = run({ to: "production", "dry-run": true });
    expect(await code).toBe(0);
    expect(output()).toBe("production/docs → mintlify\n");
    expect(promote).not.toHaveBeenCalled();
  });

  it("refuses an approval-gated environment unless --approved is passed", async () => {
    await expect(run({ to: "production", sha: SHA }).code).rejects.toThrow(
      "production is promoted only after its approval (github-environment)",
    );
    expect(promote).not.toHaveBeenCalled();
  });

  it("ships staging to production by default and reports each record", async () => {
    const { code, output } = run({ to: "production", sha: SHA, approved: true });
    expect(await code).toBe(0);
    const [root, from, to, providers, sha] = vi.mocked(promote).mock.calls[0] ?? [];
    expect([root, from, to, sha]).toEqual([ROOT, "staging", "production", SHA]);
    expect(providers?.map((provider) => provider.destination)).toEqual([
      "eas",
      "mintlify",
      "cloudflare-workers",
    ]);
    expect(output()).toBe(`production/docs ${SHA.slice(0, 12)} up\n`);
  });
});
