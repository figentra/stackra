/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveImportAlias`: an exact key, a `*` key with fallbacks tried in order (the first that
 *          is a file wins), a key with text after the `*`, and undefined for a specifier no key matches or whose
 *          targets name no file.
 * Boundary: test only; a set of paths stands in for the file system.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0091 (amendment of 2026-11-09).
 */
import { describe, expect, it } from "@stackra/testing";

import { resolveImportAlias } from "#node/encore/functions/resolve-import-alias.function";

const files = new Set([
  "/m/src/modules/orders/actions/cancel-order.action.ts",
  "/m/src/core/index.ts",
  "/m/.stackra/gen/clients.ts",
  "/m/src/main.ts",
]);
const isFile = (path: string) => files.has(path);
const imports = {
  "#modules/*": ["./src/modules/*", "./src/modules/*.ts", "./src/modules/*/index.ts"],
  "#core/*": ["./src/core/*", "./src/core/*.ts", "./src/core/*/index.ts"],
  "#stackra/*": "./.stackra/gen/*.ts",
  "#main": "./src/main.ts",
};

describe("resolveImportAlias", () => {
  it("tries a * key's targets in order and takes the first file", () => {
    expect(
      resolveImportAlias("/m", imports, "#modules/orders/actions/cancel-order.action", isFile),
    ).toBe("/m/src/modules/orders/actions/cancel-order.action.ts");
    expect(resolveImportAlias("/m", imports, "#core/index", isFile)).toBe("/m/src/core/index.ts");
    expect(resolveImportAlias("/m", imports, "#stackra/clients", isFile)).toBe(
      "/m/.stackra/gen/clients.ts",
    );
  });

  it("matches an exact key", () => {
    expect(resolveImportAlias("/m", imports, "#main", isFile)).toBe("/m/src/main.ts");
  });

  it("is undefined for a specifier no key matches or whose targets name no file", () => {
    expect(resolveImportAlias("/m", imports, "#config/app.config", isFile)).toBeUndefined();
    expect(resolveImportAlias("/m", imports, "#core/missing", isFile)).toBeUndefined();
  });
});
