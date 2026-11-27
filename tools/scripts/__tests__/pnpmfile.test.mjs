/**
 * Stackra file contract:
 * Purpose: hold the workspace `.pnpmfile.mjs` to its contract: the packed manifest loses its `#` `imports` map and
 *          its `@stackra/source` export condition, a `dist` that still imports a `#` specifier fails the pack, and a
 *          `#` specifier in a comment does not; a Stackra package without `stackra.manifest.json` on disk and in
 *          `files` fails the pack, a tooling preset, a data-only package and another kind do not (STA-1362). A
 *          `files` list gets the test exclusions, a tarball made by `pnpm pack` through this hook holds no test, and a
 *          file the tarball would hold that is a test or has a secret-shaped string fails the pack (STA-2917).
 * Boundary: writes throwaway member folders and one throwaway workspace under the OS temp directory and removes them.
 *           The secret-shaped samples are joined at run time, so this file holds none.
 * Runtime: node
 * Governing contract: ADR 0177 (PK4 release checks); ADR 0453 (registry publish); ADR 0022 (tests live in tests folders).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { hooks } from "../../../.pnpmfile.mjs";
import { TEST_EXCLUDES } from "../pack-content.mjs";
import { tarEntries } from "../scan-tarballs.mjs";

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

/** `manifest` with the test exclusions the hook adds to a `files` list. */
function withExcludes(manifest) {
  return { ...manifest, files: [...manifest.files, ...TEST_EXCLUDES] };
}

/** A Stackra library package whose `files` ships the manifest. */
const library = {
  name: "@stackra/w",
  files: ["dist", "stackra.manifest.json"],
  exports: { ".": "./dist/index.mjs" },
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
    assert.deepEqual(hooks.beforePacking(library, dir), withExcludes(library));
    const kindless = { ...library, stackra: { tier: "lib" } }; // a missing kind is a package
    assert.deepEqual(hooks.beforePacking(kindless, dir), withExcludes(kindless));
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

test("beforePacking asks no manifest of a preset, a data-only package or another kind", () => {
  const dir = stackraMember(false);
  const dataOnly = { ...library, exports: undefined }; // no exports, no main: like flow-preset
  try {
    assert.throws(
      () => hooks.beforePacking({ ...dataOnly, main: "./dist/index.mjs" }, dir),
      /no stackra\.manifest\.json/,
    );
    for (const plain of [
      { ...library, stackra: { kind: "package", tier: "config" } },
      { ...dataOnly, files: ["preset"] },
      { ...library, stackra: { kind: "skill" } },
      { name: "@stackra/v", files: ["dist"] },
    ])
      assert.deepEqual(hooks.beforePacking(plain, dir), withExcludes(plain));
  } finally {
    rmSync(dir, { recursive: true });
  }
});

/** Joined at run time, so this file holds no secret-shaped string of its own. */
const PEM_HEADER = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
const JWT = ["eyJhbGciOiJIUzI1NiJ9", "eyJzdWIiOiJ0ZXN0LXVzZXIifQ", "c2lnbmF0dXJlLWJ5dGVz"].join(
  ".",
);

/** A throwaway member folder holding `files` (relative path → content). */
function memberWith(files) {
  const dir = mkdtempSync(join(tmpdir(), "pnpmfile-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

test("beforePacking adds every test exclusion to files once and leaves the manifest on disk alone", () => {
  const source = { name: "@stackra/s", files: ["dist", "src", "!**/__tests__"] };
  const packed = hooks.beforePacking(source, "/nowhere");
  assert.deepEqual(packed.files, ["dist", "src", ...TEST_EXCLUDES]);
  assert.deepEqual(source.files, ["dist", "src", "!**/__tests__"]); // not mutated
  assert.equal(hooks.beforePacking(packed, "/nowhere"), packed); // already complete: unchanged
});

test("beforePacking packs a src whose only secret-shaped samples are in its tests", () => {
  const dir = memberWith({
    "src/core/a.ts": "export const a = 1;\n",
    "src/core/__tests__/a.test.ts": `const token = "${JWT}";\n`,
    "src/core/__tests__/__fixtures__/key.ts": `export const key = "${PEM_HEADER}";\n`,
    "src/core/b.spec.ts": `const token = "${JWT}";\n`,
  });
  try {
    const packed = hooks.beforePacking({ name: "@stackra/s", files: ["src"] }, dir);
    assert.deepEqual(packed.files, ["src", ...TEST_EXCLUDES]);
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("beforePacking refuses a shipped file with a secret-shaped string, naming file, line and kind only", () => {
  const dir = memberWith({
    "dist/index.mjs": `export const a = 1;\nconst key = "${PEM_HEADER}";\n`,
    "README.md": `Call it with \`${JWT}\`.\n`,
    "notes/skipped.md": `${JWT}\n`, // not in files: not packed, not read
  });
  try {
    assert.throws(
      () => hooks.beforePacking({ name: "@stackra/k", files: ["dist"] }, dir),
      (error) => {
        assert.match(
          error.message,
          /@stackra\/k: refusing to pack a test file or a secret-shaped string/,
        );
        assert.match(error.message, /dist\/index\.mjs:2: a private key block \(private-key\)/);
        assert.match(error.message, /README\.md:1: a JSON Web Token \(jwt\)/);
        assert.doesNotMatch(error.message, /notes\/skipped\.md/);
        assert.ok(!error.message.includes(JWT), "the finding never prints the string");
        return true;
      },
    );
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("beforePacking refuses a package without a files list that would ship its tests", () => {
  const dir = memberWith({ "index.mjs": "export {};\n", "__tests__/index.test.mjs": "\n" });
  try {
    assert.throws(
      () => hooks.beforePacking({ name: "@stackra/n" }, dir),
      /__tests__\/index\.test\.mjs:0: a test file \(add a `files` list to package\.json\)/,
    );
  } finally {
    rmSync(dir, { recursive: true });
  }
});

/** The repo root, whose `.pnpmfile.mjs` and `tools/scripts/pack-content.mjs` the throwaway workspace copies. */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

test("pnpm pack through the hook writes a tarball without the member's tests", (t) => {
  const probe = spawnSync("pnpm", ["--version"], { encoding: "utf8" });
  if (probe.error || probe.status !== 0) {
    t.skip("pnpm is not on PATH");
    return;
  }
  const workspace = memberWith({
    "package.json": '{ "name": "pack-probe-root", "private": true }\n',
    "pnpm-workspace.yaml": "packages:\n  - p\n",
    "p/package.json": JSON.stringify({
      name: "@probe/p",
      version: "1.0.0",
      files: ["dist", "src"],
    }),
    "p/dist/index.mjs": "export const a = 1;\n",
    "p/src/index.ts": "export const a = 1;\n",
    "p/src/testing/index.ts": "export const stand = 1;\n",
    "p/src/__tests__/index.test.ts": `const token = "${JWT}";\n`,
    "p/src/core/__fixtures__/key.ts": `export const key = "${PEM_HEADER}";\n`,
    "p/src/core/__snapshots__/a.snap": "\n",
    "p/src/core/a.spec.ts": "\n",
    "p/src/core/a.test-d.ts": "\n",
    "p/src/core/a.bench.ts": "\n",
  });
  try {
    copyFileSync(join(ROOT, ".pnpmfile.mjs"), join(workspace, ".pnpmfile.mjs"));
    mkdirSync(join(workspace, "tools", "scripts"), { recursive: true });
    copyFileSync(
      join(ROOT, "tools", "scripts", "pack-content.mjs"),
      join(workspace, "tools", "scripts", "pack-content.mjs"),
    );
    const pack = spawnSync("pnpm", ["pack", "--pack-destination", workspace], {
      cwd: join(workspace, "p"),
      encoding: "utf8",
    });
    assert.equal(pack.status, 0, pack.stderr || pack.stdout);
    const paths = tarEntries(readFileSync(join(workspace, "probe-p-1.0.0.tgz")))
      .map(({ path }) => path)
      .sort();
    assert.deepEqual(paths, [
      "package/dist/index.mjs",
      "package/package.json",
      "package/src/index.ts",
      "package/src/testing/index.ts",
    ]);
  } finally {
    rmSync(workspace, { recursive: true });
  }
});
