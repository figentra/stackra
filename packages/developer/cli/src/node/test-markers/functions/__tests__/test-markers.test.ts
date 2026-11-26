/**
 * Stackra file contract:
 * Purpose: hold `testFiles` and `testMarkers` to their contract: test files are the `<name>.test.<ext>` files directly
 *          in a `__tests__/` folder, outside dependencies, build output and fixtures; a marker is a `skip`, `todo`,
 *          `fixme`, `fails`, `only`, `skipIf` or `runIf` anywhere in a `describe` / `it` / `test` / `suite` chain, an
 *          `x`-prefixed call or a node:test option, carrying the title its call names (past `.skipIf(cond)` and
 *          `.each(table)` argument lists); a marker inside a comment or a string is not one.
 * Boundary: writes fixture trees into temp directories.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (decision 4); STA-2842.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { test } from "@stackra/testing";

import { testFiles } from "#node/test-markers/functions/test-files.function";
import { testMarkers } from "#node/test-markers/functions/test-markers.function";

/** A temp repository whose files are `files` (repository path to text). */
function repository(files: Readonly<Record<string, string>>): string {
  const root = mkdtempSync(join(tmpdir(), "test-markers-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

/** The kind and title of every marker in one test file's `source`. */
function markersOf(source: string): string[] {
  const root = repository({ "p/__tests__/a.test.ts": source });
  return testMarkers(root).map(({ kind, title }) => `${kind} ${title}`);
}

test("test files are the tests-folder test files outside dependencies, output and fixtures", () => {
  const root = repository({
    "packages/a/src/__tests__/a.test.ts": "",
    "packages/a/src/__tests__/a.int.test.ts": "",
    "packages/a/src/__tests__/b.test.tsx": "",
    "packages/a/src/__tests__/c.test.mjs": "",
    "packages/a/src/__tests__/helper.ts": "",
    "packages/a/src/a.test.ts": "",
    "packages/a/src/__tests__/__fixtures__/__tests__/f.test.ts": "",
    "node_modules/x/__tests__/x.test.ts": "",
    "packages/a/dist/__tests__/d.test.ts": "",
    ".claude/worktrees/w/__tests__/w.test.ts": "",
  });
  assert.deepEqual(testFiles(root), [
    "packages/a/src/__tests__/a.int.test.ts",
    "packages/a/src/__tests__/a.test.ts",
    "packages/a/src/__tests__/b.test.tsx",
    "packages/a/src/__tests__/c.test.mjs",
  ]);
});

test("member-chain markers carry the title of the test call", () => {
  assert.deepEqual(
    markersOf(
      [
        'it.skip("a", () => {});',
        "test.todo('b');",
        'describe.only("c", () => {});',
        'it.fails("d", () => {});',
        'test.fixme("e", () => {});',
        'it.concurrent.skip("f", () => {});',
        "suite.skip(`g`, () => {});",
        'it("plain", () => {});',
      ].join("\n"),
    ),
    ["skip a", "todo b", "only c", "fails d", "fixme e", "skip f", "skip g"],
  );
});

test("environment gates read the title past their condition and an each table", () => {
  assert.deepEqual(
    markersOf(
      [
        'describe.skipIf(!process.env.DATABASE_URL)("needs a database", () => {});',
        "it.runIf(process.platform === 'linux')(",
        '  "linux only",',
        "  () => {},",
        ");",
        'it.skipIf(flag).each([[1], [2]])("row %s", () => {});',
        'it.each([[1]]).skip("later %s", () => {});',
        'it.skip.each([[1]])("skipped %s", () => {});',
      ].join("\n"),
    ),
    [
      "skipIf needs a database",
      "runIf linux only",
      "skipIf row %s",
      "skip later %s",
      "skip skipped %s",
    ],
  );
});

test("x-prefixed calls are skips and node:test options are markers", () => {
  assert.deepEqual(
    markersOf(
      [
        'xit("x1", () => {});',
        'xdescribe("x2", () => {});',
        'test("o1", { skip: true }, () => {});',
        'test("o2", { skip: !hasDocker }, () => {});',
        'test("o3", { todo: "write it" }, () => {});',
        'test("o4", { only: true }, () => {});',
        'test("o5", { skip: false }, () => {});',
        'test("o6", { timeout: 5 }, () => {});',
      ].join("\n"),
    ),
    ["skip x1", "skip x2", "skip o1", "skipIf o2", "todo o3", "only o4"],
  );
});

test("a marker in a comment or a string is not a marker, and a computed title stays source text", () => {
  assert.deepEqual(
    markersOf(
      [
        '// it.skip("commented", () => {});',
        "const fixture = 'it.skip(\"in a string\", () => {})';",
        'const other = `describe.only("in a template")`;',
        "it.skip(`case ${name}`, () => {});",
        "it.skip(TITLE, () => {});",
      ].join("\n"),
    ),
    ["skip `case ${name}`", "skip TITLE"],
  );
});

test("each marker records its 1-based line and the file it is in", () => {
  const root = repository({ "q/__tests__/b.test.ts": '\n\nit.todo("third");\n' });
  assert.deepEqual(testMarkers(root), [
    { file: "q/__tests__/b.test.ts", line: 3, kind: "todo", title: "third" },
  ]);
});
