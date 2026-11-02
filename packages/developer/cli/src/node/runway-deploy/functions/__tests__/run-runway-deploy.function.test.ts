/**
 * Stackra file contract:
 * Purpose: unit tests of `stackra deploy` without `--product`: it refuses a missing environment or an unknown kind,
 *          prints each target's plan on a dry run (with the Worker members `--member` names), and hands Runway's
 *          `deploy()` the commit, every provider and the kind filter, then reports each record.
 * Boundary: test only; Runway's `readRunway` and `deploy` are mocked, nothing is deployed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decisions 1 and 3); STA-1921.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { deploy } from "@stackra/runway";
import type { RootRunway } from "@stackra/runway";
import { readRunway } from "@stackra/runway/node";
import { vi } from "vitest";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { runRunwayDeploy } from "#node/runway-deploy/functions/run-runway-deploy.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("@stackra/runway", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  deploy: vi.fn(),
}));

vi.mock("@stackra/runway/node", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  readRunway: vi.fn(),
}));

const SHA = "c".repeat(40);

const ROOT = {
  project: "core",
  providers: { encore: { app: "core-app" } },
  environments: { production: { destinations: { web: "cloudflare-workers", docs: "mintlify" } } },
  targets: {
    "cloudflare-workers": {
      members: { static: { path: "workers/static" }, registry: { path: "workers/registry" } },
    },
    mintlify: { branch: "docs-site" },
  },
} as unknown as RootRunway;

const run = (values: CliContext["values"]) => {
  const { io, output } = captureIo();
  const code = runRunwayDeploy({
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
  vi.mocked(deploy)
    .mockReset()
    .mockResolvedValue([
      {
        record: { target: "production/web", sha: SHA, reference: "static=v1" },
        report: { status: "up" },
      },
    ] as never);
});

describe("runRunwayDeploy", () => {
  it("refuses a missing environment and an unknown kind", async () => {
    await expect(run({}).code).rejects.toThrow(CliUsageError);
    await expect(run({ env: "production", kind: "workers" }).code).rejects.toThrow(
      /unknown --kind workers/,
    );
  });

  it("prints the plan of each target of the kind on a dry run", async () => {
    const { code, output } = run({
      env: "production",
      kind: "web",
      member: "static",
      sha: SHA,
      "dry-run": true,
    });
    expect(await code).toBe(0);
    expect(output()).toBe(
      [
        "production/web → cloudflare-workers",
        "  .$ pnpm turbo run build --filter=./workers/static",
        `  workers/static$ pnpm exec wrangler deploy --message ${SHA}`,
        "",
      ].join("\n"),
    );
    expect(deploy).not.toHaveBeenCalled();
  });

  it("deploys the commit through every provider with the kind filter", async () => {
    const { code, output } = run({ env: "production", kind: "web", sha: SHA });
    expect(await code).toBe(0);
    const [root, environment, sha, providers, kinds] = vi.mocked(deploy).mock.calls[0] ?? [];
    expect([root, environment, sha, kinds]).toEqual([ROOT, "production", SHA, ["web"]]);
    expect(providers?.map((provider) => provider.destination)).toEqual([
      "encore-cloud",
      "eas",
      "mintlify",
      "cloudflare-workers",
    ]);
    expect(output()).toBe(`production/web ${SHA.slice(0, 12)} up (static=v1)\n`);
  });

  it("wires no encore-cloud provider when runway names no Encore app", async () => {
    vi.mocked(readRunway).mockReturnValue({ ...ROOT, providers: {} } as RootRunway);
    expect(await run({ env: "production", sha: SHA }).code).toBe(0);
    const providers = vi.mocked(deploy).mock.calls[0]?.[3];
    expect(providers?.map((provider) => provider.destination)).toEqual([
      "eas",
      "mintlify",
      "cloudflare-workers",
    ]);
  });
});
