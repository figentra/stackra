/**
 * Stackra file contract:
 * Purpose: unit tests of `NEW_COMMAND`: a package under an existing category with the workspace LICENSE, a service
 *          with its API area, a seed pack with its three profile folders, and the refusals of an unknown kind, a bad
 *          name, a missing category or area, and a folder that exists.
 * Boundary: test only; writes a throwaway workspace in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (consequences); ADR 0294 (rule R12).
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

describe("NEW_COMMAND", () => {
  it("creates a package in the v3 shape", async () => {
    const { code, output } = run(["package", "loyalty-kit"], {
      category: "data",
      description: "Loyalty points.",
    });
    expect(await code).toBe(0);
    const folder = join(root, "packages/data/loyalty-kit");
    expect(output()).toContain("created packages/data/loyalty-kit");
    const pkg = JSON.parse(readFileSync(join(folder, "package.json"), "utf8")) as Record<
      string,
      unknown
    >;
    expect(pkg).toMatchObject({ name: "@stackra/loyalty-kit", description: "Loyalty points." });
    expect(readFileSync(join(folder, "stackra.config.ts"), "utf8")).toContain("definePackage({})");
    expect(readFileSync(join(folder, "LICENSE"), "utf8")).toBe("MIT\n");
    expect(existsSync(join(folder, "src/main.ts"))).toBe(false);
  });

  it("creates a service with its area", async () => {
    expect(await run(["service", "orders"], { area: "app" }).code).toBe(0);
    expect(readFileSync(join(root, "services/orders/stackra.config.ts"), "utf8")).toContain(
      "defineService({ area: ApiArea.App })",
    );
    expect(existsSync(join(root, "services/orders/runway.yaml"))).toBe(true);
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
    await run(["seed-pack", "commerce"]).code;
    await expect(run(["seed-pack", "commerce"]).code).rejects.toThrow(CliUsageError);
  });
});
