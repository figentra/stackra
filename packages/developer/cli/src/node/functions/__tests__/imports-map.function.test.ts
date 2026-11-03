/**
 * Stackra file contract:
 * Purpose: hold `importsMap` and `importsMapFindings` (the imports-map drift check of `stackra validate --repository`,
 *          STA-2072) to their contract: one alias per `src/` folder but `__tests__`, the `#src/*` layout when `src/`
 *          holds a file, `#plugin/*`, `#scripts/*` and `#stackra/*`, the four-target lists; and the check reports a
 *          missing, extra or retargeted alias and a member with no or a non-object map, ignores key order and skips
 *          `config` presets; dot entries in `src/` never change the map.
 * Boundary: writes fixture trees into temp directories; never this checkout.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0233 (decisions 1 and 6).
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { test } from "@stackra/testing";

import { importsMap } from "#node/functions/imports-map.function";
import { importsMapFindings } from "#node/functions/imports-map-findings.function";

/** A temp folder holding `files` (path to content). */
function tree(files: Readonly<Record<string, string>>): string {
  const root = mkdtempSync(join(tmpdir(), "imports-map-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(join(root, dirname(file)), { recursive: true });
    writeFileSync(join(root, file), content);
  }
  return root;
}

/** The four targets of an array alias. */
const targets = (path: string): string[] => [
  `./${path}/*`,
  `./${path}/*.ts`,
  `./${path}/*.tsx`,
  `./${path}/*/index.ts`,
];

// @covers sta-2072:FR-001 sta-2072:FR-003 sta-2072:AC-001 sta-2072:EC-02 sta-2072:P-001
test("a package gets one alias per src folder but __tests__, then #stackra/*", () => {
  const dir = tree({
    "src/node/cache.module.ts": "",
    "src/core/a.ts": "",
    "src/contracts/b.ts": "",
    "src/__tests__/c.test.ts": "",
  });
  const map = importsMap(dir);
  assert.deepEqual(map, {
    "#contracts/*": targets("src/contracts"),
    "#core/*": targets("src/core"),
    "#node/*": targets("src/node"),
    "#stackra/*": targets(".stackra/gen"),
  });
  assert.deepEqual(importsMap(dir), map, "same tree, same map");
});

// @covers sta-2072:FR-001 sta-2072:AC-002 sta-2072:EC-01 sta-2072:EC-04
test("a member with a file directly in src gets the #src/* layout", () => {
  assert.deepEqual(importsMap(tree({ "src/main.ts": "", "src/routes/home.ts": "" })), {
    "#src/*.function": "./src/*.function.ts",
    "#src/*": targets("src"),
    "#stackra/*": targets(".stackra/gen"),
  });
});

// @covers sta-2072:FR-001 sta-2072:EC-01
test("dot entries in src (.DS_Store, a dot folder) never change the map", () => {
  assert.deepEqual(
    importsMap(tree({ "src/.DS_Store": "", "src/.cache/x": "", "src/core/a.ts": "" })),
    { "#core/*": targets("src/core"), "#stackra/*": targets(".stackra/gen") },
  );
});

// @covers sta-2072:FR-002 sta-2072:AC-003 sta-2072:EC-03
test("root plugin/ and scripts/ folders add #plugin/* and the single-target #scripts/*", () => {
  assert.deepEqual(
    importsMap(tree({ "src/native/a.ts": "", "plugin/index.ts": "", "scripts/build.ts": "" })),
    {
      "#native/*": targets("src/native"),
      "#plugin/*": targets("plugin"),
      "#scripts/*": "./scripts/*.ts",
      "#stackra/*": targets(".stackra/gen"),
    },
  );
  assert.deepEqual(importsMap(tree({ "README.md": "" })), {
    "#stackra/*": targets(".stackra/gen"),
  });
});

/** A package.json for `packages/<category>/<name>` with `imports` and `tier`. */
const pkg = (name: string, imports: object | undefined, tier = "lib"): string =>
  JSON.stringify({ name: `@stackra/${name}`, stackra: { tier }, ...(imports && { imports }) });

// @covers sta-2072:FR-004 sta-2072:FR-005 sta-2072:AC-004 sta-2072:AC-005 sta-2072:AC-006 sta-2072:EC-05 sta-2072:EC-06 sta-2072:EC-07 sta-2072:P-002
test("the check reports missing, extra and retargeted aliases and a missing map, and skips config presets", () => {
  const stackra = targets(".stackra/gen");
  const root = tree({
    "pnpm-workspace.yaml": "packages:\n  - packages/*/*\n",
    // equal, keys in another order
    "packages/data/equal/package.json": pkg("equal", {
      "#stackra/*": stackra,
      "#node/*": targets("src/node"),
      "#core/*": targets("src/core"),
    }),
    "packages/data/equal/src/core/a.ts": "",
    "packages/data/equal/src/node/b.ts": "",
    // lacks #node/*
    "packages/data/missing/package.json": pkg("missing", {
      "#core/*": targets("src/core"),
      "#stackra/*": stackra,
    }),
    "packages/data/missing/src/core/a.ts": "",
    "packages/data/missing/src/node/b.ts": "",
    // maps a folder it does not have
    "packages/data/extra/package.json": pkg("extra", {
      "#core/*": targets("src/core"),
      "#react/*": targets("src/react"),
      "#stackra/*": stackra,
    }),
    "packages/data/extra/src/core/a.ts": "",
    // a short target list
    "packages/data/short/package.json": pkg("short", {
      "#core/*": ["./src/core/*", "./src/core/*.ts"],
      "#stackra/*": stackra,
    }),
    "packages/data/short/src/core/a.ts": "",
    // no imports at all
    "packages/data/bare/package.json": pkg("bare", undefined),
    "packages/data/bare/src/core/a.ts": "",
    // a hand-edited non-object map
    "packages/data/stringy/package.json": JSON.stringify({
      name: "@stackra/stringy",
      stackra: { tier: "lib" },
      imports: "./x",
    }),
    "packages/data/stringy/src/core/a.ts": "",
    // a config preset with no map
    "packages/tooling/preset/package.json": pkg("preset", undefined, "config"),
    "packages/tooling/preset/src/a.json": "{}",
  });
  const prefix = 'package.json "imports" is not the generated map (ADR 0233 decision 1): ';
  assert.deepEqual(importsMapFindings(root), [
    { dir: "packages/data/bare", text: `${prefix}add #core/*; add #stackra/*` },
    { dir: "packages/data/extra", text: `${prefix}remove #react/*` },
    { dir: "packages/data/missing", text: `${prefix}add #node/*` },
    { dir: "packages/data/short", text: `${prefix}retarget #core/*` },
    { dir: "packages/data/stringy", text: `${prefix}add #core/*; add #stackra/*` },
  ]);
});
