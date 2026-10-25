/**
 * Stackra file contract:
 * Purpose: unit tests of `generatedModulesPlugin`: `#stackra/<name>` resolves to gen's `.ts`, `.tsx` or `index.ts`
 *          file under the Vite root, other specifiers pass through, and a missing file fails with what to run.
 * Boundary: test only; writes a throwaway member in the OS temp directory and calls the hooks directly.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0261 (decisions 1 to 4).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { generatedModulesPlugin } from "#core/functions/generated-modules-plugin.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-vite-"));
  mkdirSync(join(root, ".stackra", "gen", "clients"), { recursive: true });
  writeFileSync(join(root, ".stackra", "gen", "wiring.ts"), "export const wiring = {};");
  writeFileSync(join(root, ".stackra", "gen", "ui.tsx"), "export {};");
  writeFileSync(join(root, ".stackra", "gen", "clients", "index.ts"), "export {};");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** The plugin's `resolveId`, with its root set and a context whose `error` throws. */
function resolver(): (source: string) => unknown {
  const plugin = generatedModulesPlugin();
  (plugin.configResolved as (config: { root: string }) => void)({ root });
  const resolveId = plugin.resolveId as (this: unknown, source: string) => unknown;
  const context = {
    error(message: string): never {
      throw new Error(message);
    },
  };
  return (source) => resolveId.call(context, source);
}

describe("generatedModulesPlugin", () => {
  it("resolves #stackra/<name> to gen's .ts file", () => {
    expect(resolver()("#stackra/wiring")).toBe(join(root, ".stackra", "gen", "wiring.ts"));
  });

  it("falls back to .tsx and to a folder's index.ts", () => {
    const resolve = resolver();
    expect(resolve("#stackra/ui")).toBe(join(root, ".stackra", "gen", "ui.tsx"));
    expect(resolve("#stackra/clients")).toBe(join(root, ".stackra", "gen", "clients", "index.ts"));
  });

  it("leaves every other specifier to Vite", () => {
    expect(resolver()("#src/routes/home")).toBeNull();
  });

  it("fails a module gen has not written, saying to run stackra gen", () => {
    expect(() => resolver()("#stackra/routes")).toThrow(/run `stackra gen`/);
  });

  it("runs before the core resolvers", () => {
    expect(generatedModulesPlugin()).toMatchObject({
      name: "stackra:generated-modules",
      enforce: "pre",
    });
  });
});
