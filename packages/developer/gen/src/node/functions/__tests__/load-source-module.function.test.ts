/**
 * Stackra file contract:
 * Purpose: unit tests of `loadSourceModule`: a typed module under `node_modules` (a registry package's shipped source)
 *          loads through a stripped copy in `.stackra/cache/sources` and resolves its bare import from the member
 *          root; a module outside `node_modules` loads directly and writes no copy.
 * Boundary: test only; writes a fixture member into a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 2).
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { loadSourceModule } from "#node/functions/load-source-module.function";

let root = "";

/** Writes `text` at `path` under the fixture member. */
const write = (path: string, text: string): string => {
  const file = join(root, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, text);
  return file;
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-load-source-"));
  write("package.json", '{"name":"@acme/service-sales","type":"module"}');
  // The member's own copy of a dependency, which the stripped copy must resolve to.
  write(
    "node_modules/@acme/dep/package.json",
    '{"name":"@acme/dep","type":"module","exports":"./index.js"}',
  );
  write("node_modules/@acme/dep/index.js", "export const DEP = 'member-dep';\n");
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("loadSourceModule", () => {
  it("strips a typed module under node_modules into the cache and loads it", async () => {
    const path = write(
      "node_modules/@acme/pkg/src/node/database/migrations/0001-create.migration.ts",
      [
        'import { DEP } from "@acme/dep";',
        "type Row = { readonly id: string };",
        "export const ROW: Row = { id: DEP };",
        "export function table(name: string): string { return name; }",
        "",
      ].join("\n"),
    );

    const exported = await loadSourceModule(root, path);

    expect(exported["ROW"]).toEqual({ id: "member-dep" });
    expect((exported["table"] as (name: string) => string)("orders")).toBe("orders");
    expect(readdirSync(join(root, ".stackra/cache/sources"))).toEqual([
      expect.stringMatching(/^0001-create\.migration\.[0-9a-f]{16}\.mjs$/),
    ]);
  });

  it("loads a module outside node_modules directly and writes no copy", async () => {
    const path = write(
      "src/modules/sales/database/migrations/0001-own.migration.ts",
      "export const OWN = 1;\n",
    );

    expect((await loadSourceModule(root, path))["OWN"]).toBe(1);
    expect(existsSync(join(root, ".stackra/cache"))).toBe(false);
  });
});
