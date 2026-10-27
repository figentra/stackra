/**
 * Stackra file contract:
 * Purpose: hold the workspace `.pnpmfile.mjs` to its contract: the packed manifest loses its `#` `imports` map and
 *          its `@stackra/source` export condition, a `dist` that still imports a `#` specifier fails the pack, and a
 *          `#` specifier in a comment does not; a Stackra package without `stackra.manifest.json` on disk and in
 *          `files` fails the pack, a tooling preset and another kind do not (STA-1362).
 * Boundary: writes throwaway member folders under the OS temp directory and removes them.
 * Runtime: node
 * Governing contract: ADR 0177 (PK4 release checks); ADR 0453 (registry publish); ADR 0022 (tests live in tests folders).
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

test("beforePacking drops the @stackra/source condition at any depth and keeps the rest", () => {
  const sourced = {
    name: "@stackra/z",
    exports: {
      ".": {
        "@stackra/source": "./src/index.ts",
        types: "./dist/index.d.mts",
        default: "./dist/index.mjs",
      },
      "./node": {
        import: { "@stackra/source": "./src/node/index.ts", default: "./dist/node.mjs" },
      },
      "./package.json": "./package.json",
    },
  };
  assert.deepEqual(hooks.beforePacking(sourced, "/nowhere"), {
    name: "@stackra/z",
    exports: {
      ".": { types: "./dist/index.d.mts", default: "./dist/index.mjs" },
      "./node": { import: { default: "./dist/node.mjs" } },
      "./package.json": "./package.json",
    },
  });
  assert.equal(sourced.exports["."]["@stackra/source"], "./src/index.ts"); // not mutated
});

test("beforePacking drops both the imports map and the source condition in one pass", () => {
  const dir = member('import { a } from "./a.mjs";\nexport { a };\n');
  try {
    const both = {
      ...pkg,
      exports: { ".": { "@stackra/source": "./src/index.ts", default: "./dist/index.mjs" } },
    };
    assert.deepEqual(hooks.beforePacking(both, dir), {
      name: "@stackra/x",
      exports: { ".": { default: "./dist/index.mjs" } },
    });
  } finally {
    rmSync(dir, { recursive: true });
  }
});

/** A Stackra library package whose `files` ships the manifest. */
const library = {
  name: "@stackra/w",
  files: ["dist", "stackra.manifest.json"],
  stackra: { kind: "package", tier: "lib" },
};

/** A throwaway member folder that holds `stackra.manifest.json` when `withManifest`. */
function stackraMember(withManifest) {
  const dir = mkdtempSync(join(tmpdir(), "pnpmfile-"));
  if (withManifest) writeFileSync(join(dir, "stackra.manifest.json"), "{}\n");
  return dir;
}

test("beforePacking packs a Stackra package whose manifest is on disk and in files", () => {
  const dir = stackraMember(true);
  try {
    assert.equal(hooks.beforePacking(library, dir), library);
    const kindless = { ...library, stackra: { tier: "lib" } }; // a missing kind is a package
    assert.equal(hooks.beforePacking(kindless, dir), kindless);
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("beforePacking refuses a Stackra package without stackra.manifest.json", () => {
  const dir = stackraMember(false);
  try {
    assert.throws(
      () => hooks.beforePacking(library, dir),
      /@stackra\/w: no stackra\.manifest\.json to pack; run `stackra gen --manifests`/,
    );
    assert.throws(
      () => hooks.beforePacking({ ...library, stackra: { tier: "lib" } }, dir),
      /no stackra\.manifest\.json to pack/,
    );
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("beforePacking refuses a Stackra package whose files leave the manifest out", () => {
  const dir = stackraMember(true);
  try {
    assert.throws(
      () => hooks.beforePacking({ ...library, files: ["dist"] }, dir),
      /@stackra\/w: package\.json `files` leaves out stackra\.manifest\.json/,
    );
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("beforePacking asks no manifest of a tooling preset, another kind or a non-Stackra member", () => {
  const dir = stackraMember(false);
  try {
    for (const plain of [
      { ...library, stackra: { kind: "package", tier: "config" } },
      { ...library, stackra: { kind: "skill" } },
      { name: "@stackra/v", files: ["dist"] },
    ])
      assert.equal(hooks.beforePacking(plain, dir), plain);
  } finally {
    rmSync(dir, { recursive: true });
  }
});
