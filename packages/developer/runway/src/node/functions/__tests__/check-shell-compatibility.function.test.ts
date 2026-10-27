/**
 * Stackra file contract:
 * Purpose: unit tests of `checkShellCompatibility`: each product checkout is built with the next import map path in
 *          its arguments; a bundle whose target and imports the next shell serves passes; an unserved target, an
 *          import the map does not resolve (exact or `/` prefix) and a failed build are all listed in one error; a
 *          product without bundle surfaces is skipped.
 * Boundary: test only; runs in temporary folders with a fake command runner that writes the bundle, so nothing builds.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); app-shells 15 (point 7) and 16 (point 3).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { checkShellCompatibility } from "#node/functions/check-shell-compatibility.function";
import { PRODUCT_ROOT, writeBundle } from "#node/functions/__tests__/fixtures/product-root.fixture";
import type { CommandRunner } from "#node/types/command-runner.type";

let folder: string;
let importMap: string;
let calls: Parameters<CommandRunner>[];

/** A product checkout whose build writes a console bundle with `overrides`. */
function product(name: string, overrides: Record<string, unknown> = {}): string {
  const repository = join(folder, name);
  writeBundle(repository, "console", "1.3.0", overrides);
  writeFileSync(join(repository, "runway.yaml"), JSON.stringify(PRODUCT_ROOT));
  return repository;
}

const run: CommandRunner = async (command, args, options) => {
  calls.push([command, args, options]);
  return "";
};

beforeEach(() => {
  calls = [];
  folder = mkdtempSync(join(tmpdir(), "stackra-compat-"));
  importMap = join(folder, "import-map.json");
  writeFileSync(
    importMap,
    JSON.stringify({
      imports: { react: "https://a.test/react.js", "@stackra/ui/": "https://a.test/ui/" },
    }),
  );
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

describe("checkShellCompatibility", () => {
  it("builds each product against the next import map and passes a compatible bundle", async () => {
    const repository = product("mezzora");
    await checkShellCompatibility({
      repositories: [repository],
      importMap,
      served: ["console@3"],
      run,
    });
    expect(calls).toEqual([
      ["pnpm", ["run", "build:bundles", "--", "--import-map", importMap], { cwd: repository }],
    ]);
  });

  it("lists every break of every product in one error", async () => {
    const unserved = product("a", { targets: "console@4" });
    const unresolved = product("b", { imports: ["react", "react-dom"] });
    const broken = product("c");
    const failing: CommandRunner = async (command, args, options) => {
      if (options.cwd === broken) throw new Error("vite exited with 1");
      return run(command, args, options);
    };
    try {
      await checkShellCompatibility({
        repositories: [unserved, unresolved, broken],
        importMap,
        served: ["console@3"],
        run: failing,
      });
      throw new Error("expected a RunwayInvalidError");
    } catch (error) {
      expect(error).toBeInstanceOf(RunwayInvalidError);
      expect((error as RunwayInvalidError).issues.map((issue) => issue.path)).toEqual([
        `${unserved}:surfaces.console.targets`,
        `${unresolved}:surfaces.console.imports`,
        broken,
      ]);
    }
  });

  it("skips a product with no bundle surface", async () => {
    const repository = join(folder, "docs");
    writeBundle(repository, "unused", "1.0.0");
    writeFileSync(
      join(repository, "runway.yaml"),
      JSON.stringify({ version: 3, project: "docs", environments: {} }),
    );
    await checkShellCompatibility({
      repositories: [repository],
      importMap,
      served: ["console@3"],
      run,
    });
    expect(calls).toEqual([]);
  });
});
