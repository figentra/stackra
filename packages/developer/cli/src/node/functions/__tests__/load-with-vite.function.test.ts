/**
 * Stackra file contract:
 * Purpose: unit tests of `loadWithVite`: it imports a TypeScript module whose class carries a legacy decorator, and a
 *          linked workspace package resolves to its source through `@stackra/source` while its `dist` does not exist.
 * Boundary: test only; each case builds a throwaway member folder, the package linked into its node_modules.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 5); STA-1947.
 */
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { loadWithVite } from "#node/functions/load-with-vite.function";

let root = "";

/** Writes `text` at `path` under the temporary folder. */
const write = (path: string, text: string): void => {
  const file = join(root, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, text);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-vite-"));
  write("member/package.json", '{"name":"member","type":"module"}');
  // A workspace package: its source exists, its dist was never built.
  write(
    "dep/package.json",
    JSON.stringify({
      name: "@stackra/dep-fixture",
      type: "module",
      exports: { ".": { "@stackra/source": "./src/index.ts", default: "./dist/index.mjs" } },
    }),
  );
  write("dep/src/index.ts", 'export const SOURCE: string = "dep source";\n');
  mkdirSync(join(root, "member/node_modules/@stackra"), { recursive: true });
  symlinkSync(join(root, "dep"), join(root, "member/node_modules/@stackra/dep-fixture"), "dir");
  write(
    "member/src/decorated.ts",
    [
      'import { SOURCE } from "@stackra/dep-fixture";',
      "const mark = (target: object): void => {",
      '  (target as { marked?: string }).marked = "yes";',
      "};",
      "@mark",
      "export class Decorated {}",
      "export const FROM_DEP = SOURCE;",
      "",
    ].join("\n"),
  );
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("loadWithVite", () => {
  it("loads a decorated class and a linked package's source", async () => {
    const loaded = await loadWithVite(join(root, "member/src/decorated.ts"), join(root, "member"));
    expect((loaded["Decorated"] as { marked?: string }).marked).toBe("yes");
    expect(loaded["FROM_DEP"]).toBe("dep source");
  });
});
