/**
 * Stackra file contract:
 * Purpose: hold the workspace `.pnpmfile.mjs` to its contract: the packed manifest loses its `#` `imports` map, a
 *          `dist` that still imports a `#` specifier fails the pack, and a `#` specifier in a comment does not.
 * Boundary: writes throwaway member folders under the OS temp directory and removes them.
 * Runtime: node
 * Governing contract: ADR 0177 (PK4 release checks); ADR 0022 (tests live in tests folders).
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { hooks } from "../../../.pnpmfile.mjs";

/** A throwaway member folder whose `dist/index.mjs` holds `code`. */
function member(code) {
  const dir = mkdtempSync(join(tmpdir(), "pnpmfile-"));
  mkdirSync(join(dir, "dist"));
  writeFileSync(join(dir, "dist", "index.mjs"), code);
  return dir;
}

const pkg = {
  name: "@stackra/x",
  imports: { "#core/*": ["./src/core/*", "./src/core/*.ts"] },
  exports: "./dist/index.mjs",
};

test("beforePacking drops the imports map when dist names no # specifier, comments included", () => {
  const dir = member(
    '/**\n * import { wiring } from "#stackra/wiring";\n */\nimport { a } from "./a.mjs";\nexport { a };\n',
  );
  try {
    assert.deepEqual(hooks.beforePacking(pkg, dir), {
      name: "@stackra/x",
      exports: "./dist/index.mjs",
    });
    assert.equal(pkg.imports["#core/*"].length, 2); // the manifest passed in is not mutated
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("beforePacking refuses a dist that still imports a # specifier", () => {
  for (const code of [
    'import { a } from "#core/a";\n',
    'export * from "#core/a";\n',
    'const m = await import("#core/a");\n',
  ]) {
    const dir = member(code);
    try {
      assert.throws(
        () => hooks.beforePacking(pkg, dir),
        /dist\/index\.mjs still import a "#" specifier/,
      );
    } finally {
      rmSync(dir, { recursive: true });
    }
  }
});

test("beforePacking leaves a manifest without an imports map as it is", () => {
  const plain = { name: "@stackra/y" };
  assert.equal(hooks.beforePacking(plain, "/nowhere"), plain);
});
