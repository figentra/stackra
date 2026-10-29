/**
 * Stackra file contract:
 * Purpose: unit tests of `NEW_COMMAND`: a package under an existing category with the workspace LICENSE, a service
 *          with its API area, a seed pack with its three profile folders, the product-scoped and `--scope` names with
 *          `catalog:stackra` versions, `--over` (writes only missing files, diffs authored ones, keeps runway.yaml and
 *          CHANGELOG.md), and the refusals of an unknown kind, a bad name or scope, a missing category or area, and
 *          a folder that exists without `--over`.
 * Boundary: test only; writes a throwaway workspace in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (consequences); ADR 0294 (rule R12); ADR 0349; STA-1210.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { NEW_COMMAND } from "#node/constants/new-command.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import type { CliContext } from "#node/types/cli-context.type";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  writeFileSync(join(root, "LICENSE"), "MIT\n");
  mkdirSync(join(root, "packages/data"), { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const run = (positionals: readonly string[], values: CliContext["values"] = {}) => {
  const { io, output } = captureIo();
  const code = NEW_COMMAND.run({
    cwd: join(root, "packages"),
    io,
    values,
    positionals,
    rest: [],
    cli: async () => 0,
  });
  return { code, output };
};

/** The package name written at a member path. */
const nameOf = (path: string) =>
  (JSON.parse(readFileSync(join(root, path, "package.json"), "utf8")) as { name: string }).name;

describe("NEW_COMMAND", () => {
  it("creates a package in the v3 shape", async () => {
    const { code, output } = run(["package", "loyalty-kit"], {
      category: "data",
      description: "Loyalty points.",
      summary: "Reach for it to reward repeat buyers.",
    });
    expect(await code).toBe(0);
    const folder = join(root, "packages/data/loyalty-kit");
    expect(output()).toContain("created packages/data/loyalty-kit");
    const pkg = JSON.parse(readFileSync(join(folder, "package.json"), "utf8")) as Record<
      string,
      unknown
    >;
    expect(pkg).toMatchObject({ name: "@stackra/loyalty-kit", description: "Loyalty points." });
    // ADR 0453 decision 11 (amendment of 2026-10-27): the npm metadata, the `stackra` field and its turbo tags.
    expect(pkg).toMatchObject({
      keywords: ["stackra", "data"],
      homepage: "https://github.com/figentra/stackra/tree/main/packages/data/loyalty-kit#readme",
      author: "Figentra (https://figentra.com)",
      engines: { node: ">=24.0.0" },
      stackra: {
        kind: "package",
        tier: "lib",
        category: "data",
        runtimes: ["isomorphic"],
        summary: "Reach for it to reward repeat buyers.",
      },
    });
    expect(readFileSync(join(folder, "turbo.jsonc"), "utf8")).toContain(
      '"tags": ["tier:lib","category:data","runtime:isomorphic"]',
    );
    expect(readFileSync(join(folder, "stackra.config.ts"), "utf8")).toContain("definePackage({})");
    expect(readFileSync(join(folder, "LICENSE"), "utf8")).toBe("MIT\n");
    expect(existsSync(join(folder, "src/main.ts"))).toBe(false);
  });

  it("creates a service with its area", async () => {
    expect(await run(["service", "orders"], { area: "app" }).code).toBe(0);
    expect(
      JSON.parse(readFileSync(join(root, "services/orders/package.json"), "utf8")) as unknown,
    ).toMatchObject({ stackra: { kind: "package", tier: "service", runtimes: ["node"] } });
    expect(readFileSync(join(root, "services/orders/stackra.config.ts"), "utf8")).toContain(
      "defineService({ area: ApiArea.App })",
    );
    expect(existsSync(join(root, "services/orders/runway.yaml"))).toBe(true);
  });

  it("names a service from the root runway product key, in the template shape", async () => {
    writeFileSync(join(root, "runway.yaml"), "version: 3\nproduct:\n  key: beautilon\n");
    writeFileSync(
      join(root, "pnpm-workspace.yaml"),
      "packages: []\ncatalogs:\n  stackra:\n    '@stackra/contracts': 0.1.0\n",
    );
    expect(await run(["service", "salon"], { area: "app" }).code).toBe(0);
    const pkg = JSON.parse(readFileSync(join(root, "services/salon/package.json"), "utf8")) as {
      name: string;
      imports: Record<string, unknown>;
      exports: Record<string, unknown>;
      dependencies: Record<string, string>;
    };
    expect(pkg.name).toBe("@figentra/beautilon-service-salon");
    expect(pkg.dependencies["@stackra/contracts"]).toBe("catalog:stackra");
    // gen's server entry imports @stackra/app, and gen refuses an undeclared generated dependency.
    expect(pkg.dependencies["@stackra/app"]).toBe("catalog:stackra");
    expect(Object.keys(pkg.imports)).toEqual(expect.arrayContaining(["#src/*", "#assets/*"]));
    expect(pkg.exports).toEqual({ "./assets/*": "./assets/*" });
    expect(existsSync(join(root, "services/salon/assets/.gitkeep"))).toBe(true);
  });

  it("names a member from --scope", async () => {
    expect(await run(["service", "orders"], { area: "app", scope: "@acme" }).code).toBe(0);
    expect(
      await run(["package", "loyalty-kit"], { category: "data", scope: "commerce" }).code,
    ).toBe(0);
    expect(nameOf("services/orders")).toBe("@acme/service-orders");
    expect(nameOf("packages/data/loyalty-kit")).toBe("@figentra/commerce-loyalty-kit");
  });

  it("regenerates over an existing member with --over", async () => {
    const folder = join(root, "services/orders");
    mkdirSync(join(folder, "src/modules/orders"), { recursive: true });
    writeFileSync(join(folder, "README.md"), "# authored\n");
    writeFileSync(
      join(folder, "runway.yaml"),
      "version: 3\nenvironments:\n  dev:\n    port: 4001\n",
    );
    writeFileSync(join(folder, "src/modules/orders/orders.module.ts"), "// authored\n");
    const { code, output } = run(["service", "orders"], { area: "app", over: true });
    expect(await code).toBe(0);
    expect(readFileSync(join(folder, "README.md"), "utf8")).toBe("# authored\n");
    expect(output()).toContain("--- services/orders/README.md (authored, kept)");
    expect(output()).toContain("-# authored");
    expect(output()).toContain("wrote services/orders/package.json");
    expect(output()).not.toContain("runway.yaml");
    expect(readFileSync(join(folder, "runway.yaml"), "utf8")).toContain("port: 4001");
    expect(readFileSync(join(folder, "src/modules/orders/orders.module.ts"), "utf8")).toBe(
      "// authored\n",
    );
    expect(existsSync(join(folder, "CHANGELOG.md"))).toBe(false);
    expect(existsSync(join(folder, "stackra.config.ts"))).toBe(true);
  });

  it("creates a seed pack with its profiles", async () => {
    expect(await run(["seed-pack", "commerce"]).code).toBe(0);
    expect(readFileSync(join(root, "seed-packs/commerce/seed-pack.yaml"), "utf8")).toContain(
      "key: seed-pack:commerce",
    );
    for (const profile of ["minimal", "demo", "test"])
      expect(existsSync(join(root, `seed-packs/commerce/profiles/${profile}/README.md`))).toBe(
        true,
      );
  });

  it("refuses what it cannot create", async () => {
    await expect(run(["app", "web"]).code).rejects.toThrow(CliUsageError);
    await expect(run(["package", "Bad_Name"], { category: "data" }).code).rejects.toThrow(
      CliUsageError,
    );
    await expect(run(["package", "x"], { category: "nowhere" }).code).rejects.toThrow(
      CliUsageError,
    );
    await expect(run(["service", "x"], { area: "intranet" }).code).rejects.toThrow(CliUsageError);
    await expect(run(["service", "x"], { area: "app", scope: "Bad Scope" }).code).rejects.toThrow(
      CliUsageError,
    );
    await run(["seed-pack", "commerce"]).code;
    await expect(run(["seed-pack", "commerce"]).code).rejects.toThrow(CliUsageError);
  });
});
