/**
 * Stackra file contract:
 * Purpose: unit tests of `stackra build --product`: `productPackages` lists each runway package once, `runBuildProduct`
 *          refuses an unknown environment, hands Runway the line scope, the flags and the Vite bundler, and reports
 *          every surface and mobile app it built, planned or skipped.
 * Boundary: test only; Runway's `readRunway` and `buildProduct` are mocked, nothing is built.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 4); ADR 0441 (decision 3).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { buildProduct, readRunway } from "@stackra/runway/node";
import type { RootRunway } from "@stackra/runway";
import { vi } from "vitest";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { productPackages } from "#node/product/functions/product-packages.function";
import { runBuildProduct } from "#node/product/functions/run-build-product.function";
import { viteBundler } from "#node/product/functions/vite-bundler.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("@stackra/runway/node", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  buildProduct: vi.fn(),
  readRunway: vi.fn(),
}));

const ROOT = {
  project: "acme",
  surfaces: {
    console: { shell: "os/console@3", packages: ["@acme/console-ui", "@acme/shared"] },
    landing: { content: "assets/landing" },
  },
  mobile: { app: { template: "os/mobile@3", packages: ["@acme/shared", "@acme/mobile-ui"] } },
} as unknown as RootRunway;

const run = (values: CliContext["values"]) => {
  const { io, output } = captureIo();
  const code = runBuildProduct({
    cwd: "/repo",
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
  vi.mocked(buildProduct).mockReset();
});

describe("productPackages", () => {
  it("lists every surface and mobile package once, in runway order", () => {
    expect(productPackages(ROOT)).toEqual(["@acme/console-ui", "@acme/shared", "@acme/mobile-ui"]);
    expect(productPackages({ project: "bare" } as unknown as RootRunway)).toEqual([]);
  });
});

describe("runBuildProduct", () => {
  it("refuses an unknown environment before reading the runway", async () => {
    await expect(run({ product: true, env: "moon" }).code).rejects.toThrow(CliUsageError);
    expect(readRunway).not.toHaveBeenCalled();
  });

  it("builds with the packages' scope and reports surfaces, apps and the manifest", async () => {
    vi.mocked(buildProduct).mockResolvedValue({
      surfaces: {
        console: {
          shell: { package: "@acme/os-console", version: "3.1.0" },
          packages: ["@acme/console-ui"],
          bundle: { version: "abc123" },
        },
        landing: { shell: { package: "@acme/os-landing", version: "1.0.0" }, packages: [] },
      },
      mobile: {
        app: {
          template: { package: "@acme/os-mobile", version: "3.0.2" },
          capabilities: ["push", "camera"],
          buildIds: ["ios-1", "android-1"],
        },
      },
      skipped: { mobile: [] },
    } as never);
    const { code, output } = run({ product: true, env: "staging", os: "../os" });

    expect(await code).toBe(0);
    expect(buildProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        repository: "/repo",
        scope: "@acme",
        os: "../os",
        environment: "staging",
        dryRun: false,
        surfacesOnly: false,
        bundle: viteBundler,
      }),
    );
    expect(output()).toContain(
      "surface console: @acme/os-console@3.1.0, 1 package(s), bundle abc123",
    );
    expect(output()).toContain("surface landing: @acme/os-landing@1.0.0, 0 package(s), no bundle");
    expect(output()).toContain(
      "mobile app: @acme/os-mobile@3.0.2, capabilities [push, camera], EAS builds ios-1, android-1",
    );
    expect(output()).toMatch(/wrote .*build\.json\n$/);
  });

  it("plans the bundles on a dry run and names the apps --surfaces-only skipped", async () => {
    vi.mocked(buildProduct).mockResolvedValue({
      surfaces: {
        console: {
          shell: { package: "@acme/os-console", version: "3.1.0" },
          packages: ["@acme/console-ui"],
        },
      },
      mobile: {},
      skipped: { mobile: ["app"] },
    } as never);
    const { code, output } = run({
      product: true,
      "dry-run": true,
      "surfaces-only": true,
      scope: "@lines",
    });

    expect(await code).toBe(0);
    expect(buildProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "@lines",
        environment: "production",
        dryRun: true,
        surfacesOnly: true,
      }),
    );
    expect(vi.mocked(buildProduct).mock.calls[0]?.[0]).not.toHaveProperty("os");
    expect(output()).toContain("1 package(s), bundle planned");
    expect(output()).toContain("mobile app: skipped (--surfaces-only)");
    expect(output()).toContain("(dry run)");
  });
});
