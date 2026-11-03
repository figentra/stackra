/**
 * Stackra file contract:
 * Purpose: unit tests of `stackra deploy` without `--product`: it refuses a missing environment or an unknown kind,
 *          prints each target's plan on a dry run (with the Worker members `--member` names), and hands Runway's
 *          `deploy()` the commit, every provider and the kind filter, then reports each record. With
 *          `secrets.sync: on-deploy` it syncs the secrets first when services ship, and stops if the sync fails.
 * Boundary: test only; Runway's `readRunway`, `readRunways`, `syncSecrets` and `deploy` are mocked, nothing is
 *           deployed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decisions 1 and 3); STA-1921; STA-606.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { deploy } from "@stackra/runway";
import type { RootRunway } from "@stackra/runway";
import { readRunway, readRunways, syncSecrets } from "@stackra/runway/node";
import { vi } from "vitest";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { probeHosts } from "#node/doctor/functions/probe-hosts.function";
import { runDeployProduct } from "#node/product/functions/run-deploy-product.function";
import { runRunwayDeploy } from "#node/runway-deploy/functions/run-runway-deploy.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("@stackra/runway", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  deploy: vi.fn(),
}));

vi.mock("@stackra/runway/node", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  readRunway: vi.fn(),
  readRunways: vi.fn(),
  syncSecrets: vi.fn(),
}));

vi.mock("#node/doctor/functions/probe-hosts.function", () => ({ probeHosts: vi.fn() }));

vi.mock("#node/product/functions/run-deploy-product.function", () => ({
  runDeployProduct: vi.fn(),
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
  vi.mocked(probeHosts).mockReset().mockResolvedValue([]);
  vi.mocked(runDeployProduct).mockReset().mockResolvedValue(0);
  vi.mocked(readRunway).mockReset().mockReturnValue(ROOT);
  vi.mocked(readRunways)
    .mockReset()
    .mockReturnValue({ root: ROOT, members: [] } as never);
  vi.mocked(syncSecrets).mockReset().mockResolvedValue();
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

  it("refuses an environment whose runway declares an approval unless --approved is passed", async () => {
    const gated = {
      ...ROOT,
      environments: {
        production: {
          ...ROOT.environments.production,
          deploy: { on: "merge-to-main", approval: "github-environment" },
        },
      },
    } as RootRunway;
    vi.mocked(readRunway).mockReturnValue(gated);
    await expect(run({ env: "production", sha: SHA }).code).rejects.toThrow(
      "production deploys only after its approval (github-environment)",
    );
    expect(deploy).not.toHaveBeenCalled();
    expect(await run({ env: "production", sha: SHA, approved: true }).code).toBe(0);
    expect(deploy).toHaveBeenCalledTimes(1);
  });

  it("ships a product's web and mobile through the product publish and the other kinds through deploy()", async () => {
    const product = {
      ...ROOT,
      surfaces: { console: { shell: "os/console@3", host: "console.acme" } },
      mobile: { app: {} },
    } as unknown as RootRunway;
    vi.mocked(readRunway).mockReturnValue(product);
    expect(await run({ env: "production", sha: SHA }).code).toBe(0);
    const [context] = vi.mocked(runDeployProduct).mock.calls[0] ?? [];
    expect(context?.values).toMatchObject({ product: true, env: "production" });
    expect(context?.values).not.toHaveProperty("surfaces-only");
    expect(context?.values).not.toHaveProperty("mobile-only");
    expect(vi.mocked(deploy).mock.calls[0]?.[4]).toEqual(["services", "desktop", "docs"]);
  });

  it("scopes the product publish to the kind asked for, and skips deploy() when nothing else is left", async () => {
    const product = {
      ...ROOT,
      surfaces: { console: { shell: "os/console@3", host: "console.acme" } },
      mobile: { app: {} },
    } as unknown as RootRunway;
    vi.mocked(readRunway).mockReturnValue(product);
    expect(await run({ env: "production", kind: "web", sha: SHA }).code).toBe(0);
    expect(vi.mocked(runDeployProduct).mock.calls[0]?.[0].values).toMatchObject({
      "surfaces-only": true,
    });
    expect(deploy).not.toHaveBeenCalled();
    vi.mocked(runDeployProduct).mockClear();
    expect(await run({ env: "production", kind: "mobile", sha: SHA, "dry-run": true }).code).toBe(
      0,
    );
    expect(vi.mocked(runDeployProduct).mock.calls[0]?.[0].values).toMatchObject({
      "mobile-only": true,
      "dry-run": true,
    });
  });

  it("stops before deploy() when the product publish fails", async () => {
    vi.mocked(readRunway).mockReturnValue({
      ...ROOT,
      surfaces: { console: { shell: "os/console@3", host: "console.acme" } },
    } as unknown as RootRunway);
    vi.mocked(runDeployProduct).mockResolvedValue(1);
    expect(await run({ env: "production", sha: SHA }).code).toBe(1);
    expect(deploy).not.toHaveBeenCalled();
  });

  it("probes the host map after a product publish and fails when a host does not serve", async () => {
    vi.mocked(readRunway).mockReturnValue({
      ...ROOT,
      environments: {
        production: { ...ROOT.environments.production, domains: { zone: "acme.dev" } },
      },
      surfaces: { console: { shell: "os/console@3", host: "console" } },
    } as unknown as RootRunway);
    vi.mocked(probeHosts).mockResolvedValue([{ host: "console.acme.dev", address: "", ok: false }]);
    const { code, output } = run({ env: "production", sha: SHA });
    expect(await code).toBe(1);
    expect(probeHosts).toHaveBeenCalledWith(["console.acme.dev"]);
    expect(output()).toContain("console.acme.dev no address does not serve");
  });

  it("still plans a gated environment on a dry run without --approved", async () => {
    const gated = {
      ...ROOT,
      environments: {
        production: {
          ...ROOT.environments.production,
          deploy: { on: "merge-to-main", approval: "github-environment" },
        },
      },
    } as RootRunway;
    vi.mocked(readRunway).mockReturnValue(gated);
    expect(await run({ env: "production", sha: SHA, "dry-run": true }).code).toBe(0);
    expect(deploy).not.toHaveBeenCalled();
  });

  describe("with secrets.sync: on-deploy", () => {
    beforeEach(() => {
      vi.mocked(readRunway).mockReturnValue({
        ...ROOT,
        secrets: { sync: "on-deploy" },
      } as RootRunway);
    });

    it("syncs the secrets before deploy() when services ship", async () => {
      expect(await run({ env: "production", sha: SHA }).code).toBe(0);
      expect(vi.mocked(syncSecrets).mock.calls[0]?.[0]).toMatchObject({
        environment: "production",
        repository: ".",
        dryRun: false,
      });
      expect(vi.mocked(syncSecrets).mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(deploy).mock.invocationCallOrder[0] ?? 0,
      );
    });

    it("prints the sync's names on a dry run, and skips it when no services ship", async () => {
      expect(await run({ env: "production", sha: SHA, "dry-run": true }).code).toBe(0);
      expect(vi.mocked(syncSecrets).mock.calls[0]?.[0]).toMatchObject({ dryRun: true });
      vi.mocked(syncSecrets).mockClear();
      expect(await run({ env: "production", kind: "web", sha: SHA }).code).toBe(0);
      expect(syncSecrets).not.toHaveBeenCalled();
    });

    it("ships nothing when the sync fails", async () => {
      vi.mocked(syncSecrets).mockRejectedValue(new Error("STRIPE_SECRET_KEY is missing"));
      await expect(run({ env: "production", sha: SHA }).code).rejects.toThrow("STRIPE_SECRET_KEY");
      expect(deploy).not.toHaveBeenCalled();
    });
  });

  it("syncs no secrets when the runway does not ask for it", async () => {
    expect(await run({ env: "production", sha: SHA }).code).toBe(0);
    expect(syncSecrets).not.toHaveBeenCalled();
  });
});
