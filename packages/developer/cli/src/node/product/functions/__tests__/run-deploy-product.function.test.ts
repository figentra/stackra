/**
 * Stackra file contract:
 * Purpose: unit tests of `stackra deploy --product`: it refuses a missing or unknown environment, splits the comma
 *          lists, hands Runway the facts, the store accounts and the flags, fills dry-run stand-ins from the build
 *          manifest, and reports the rows, uploads, submissions and landing seeds.
 * Boundary: test only; Runway's `readRunway` and `deployProduct` are mocked, nothing is deployed; the dry-run case
 *           writes a build manifest into a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 4); ADR 0439 (decision 2).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import type { RootRunway } from "@stackra/runway";
import { deployProduct, PRODUCT_BUILD_SETTINGS, readRunway } from "@stackra/runway/node";
import { vi } from "vitest";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { runDeployProduct } from "#node/product/functions/run-deploy-product.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("@stackra/runway/node", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  deployProduct: vi.fn(),
  readRunway: vi.fn(),
}));

const VARIABLES = [
  "STACKRA_ASSETS_BUCKET",
  "STACKRA_ASSETS_ORIGIN",
  "STACKRA_EDGE_KV_NAMESPACE",
  "STACKRA_SERVED_SHELLS",
  "STACKRA_CANARY_SCOPES",
  "STACKRA_REGION",
];

const ROOT = {
  project: "acme",
  mobile: {
    app: { stores: { apple: { account: "acme-apple" }, google: { account: "acme-play" } } },
    kiosk: {},
  },
} as unknown as RootRunway;

const DEPLOY = {
  product: "acme",
  sha: "0123456789abcdef0123",
  surfaces: { written: ["host:console.acme", "shell:console"], uploaded: ["a.js"] },
  submitted: { app: ["ios-1", "android-1"] },
  seeds: { landing: ["home", "pricing"] },
};

let folder = "";

const run = (values: CliContext["values"]) => {
  const { io, output } = captureIo();
  const code = runDeployProduct({
    cwd: folder,
    io,
    values,
    positionals: [],
    rest: [],
    cli: async () => 0,
  });
  return { code, output };
};

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), "stackra-deploy-product-"));
  vi.mocked(readRunway).mockReset().mockReturnValue(ROOT);
  vi.mocked(deployProduct)
    .mockReset()
    .mockResolvedValue(DEPLOY as never);
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
  for (const name of VARIABLES) Reflect.deleteProperty(process.env, name);
});

describe("runDeployProduct", () => {
  it.each([undefined, "moon"])("refuses the environment %s", async (env) => {
    await expect(
      run({ product: true, ...(env === undefined ? {} : { env }) }).code,
    ).rejects.toThrow(CliUsageError);
    expect(deployProduct).not.toHaveBeenCalled();
  });

  it("deploys with the facts, the lists and the store accounts, and reports the result", async () => {
    process.env["STACKRA_ASSETS_BUCKET"] = "acme-assets";
    process.env["STACKRA_CANARY_SCOPES"] = " tenant-a, ,tenant-b ";
    process.env["STACKRA_REGION"] = "me-central";
    const { code, output } = run({
      product: true,
      env: "staging",
      "assets-origin": "https://assets.staging.figentra.com",
      "kv-namespace": "0123456789abcdef0123456789abcdef",
      served: "console, landing",
      approved: true,
    });

    expect(await code).toBe(0);
    const options = vi.mocked(deployProduct).mock.calls[0]?.[0];
    expect(options).toMatchObject({
      repository: folder,
      environment: "staging",
      approved: true,
      assets: { bucket: "acme-assets", origin: "https://assets.staging.figentra.com" },
      served: ["console", "landing"],
      canaryScopes: ["tenant-a", "tenant-b"],
      firstRelease: false,
      region: "me-central",
      surfacesOnly: false,
      dryRun: false,
      stores: {
        app: [
          { store: "app_store", owner: "platform", account: "acme-apple" },
          { store: "google_play", owner: "platform", account: "acme-play" },
        ],
        kiosk: [],
      },
    });
    expect(options).toHaveProperty("kv");
    expect(output()).toContain(
      "deployed acme 0123456789ab to staging: 2 KV row(s), 1 upload(s), 2 mobile submission(s)",
    );
    expect(output()).toContain("landing landing: 2 seed document(s) listed");
    expect(output()).toContain(`wrote ${PRODUCT_BUILD_SETTINGS.deployManifest("staging")}`);
  });

  it("fills dry-run stand-ins from the build manifest and needs no KV namespace", async () => {
    const manifest = join(folder, PRODUCT_BUILD_SETTINGS.manifest);
    mkdirSync(dirname(manifest), { recursive: true });
    writeFileSync(
      manifest,
      JSON.stringify({
        surfaces: {
          console: { shell: { line: "os/console@3" } },
          site: { shell: { line: "os/landing@1" } },
        },
      }),
    );
    const { code, output } = run({
      product: true,
      env: "dev",
      "dry-run": true,
      "surfaces-only": true,
    });

    expect(await code).toBe(0);
    const options = vi.mocked(deployProduct).mock.calls[0]?.[0];
    expect(options).toMatchObject({
      assets: { bucket: "dry-run", origin: "https://assets.example.invalid" },
      served: ["console@3", "landing@1"],
      firstRelease: true,
      surfacesOnly: true,
      dryRun: true,
    });
    expect(options).not.toHaveProperty("kv");
    expect(options).not.toHaveProperty("canaryScopes");
    expect(output()).toContain("to dev (dry run)");
  });
});
