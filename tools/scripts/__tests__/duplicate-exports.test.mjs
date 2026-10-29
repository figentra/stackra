/**
 * Stackra file contract:
 * Purpose: hold `duplicate-exports.mjs` to its contract: a name declared in two packages' `src/` is a finding naming
 *          both; re-exports, tests, `.d.ts` files, one package declaring a value and a type of one name, and members
 *          outside `packages/` do not count; `ALLOWED` and `PENDING` exempt a name; stale allow-list entries are listed;
 *          a `PENDING` entry with no duplicate left is a finding (shrink-only, rule-gap N-6);
 *          the shipped lists keep the copies stackra-224 removed out of them.
 * Boundary: writes fixture workspaces into temp directories; reads nothing of this checkout.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0305; stackra-224 (STA-1382).
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import {
  ALLOWED,
  PENDING,
  duplicateExportFindings,
  duplicateExports,
  staleAllowListEntries,
} from "../duplicate-exports.mjs";

/** A temp workspace: `files` maps a repository path to its text; each member gets a package.json from `members`. */
function workspace(members, files) {
  const root = mkdtempSync(join(tmpdir(), "duplicate-exports-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - packages/*/*\n");
  for (const [dir, name] of Object.entries(members)) {
    mkdirSync(join(root, dir), { recursive: true });
    writeFileSync(join(root, dir, "package.json"), JSON.stringify({ name }));
  }
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

const MEMBERS = {
  "packages/foundation/support": "@stackra/support",
  "packages/data/documents": "@stackra/documents",
  "packages/experience/experience": "@stackra/experience",
  "apps/web": "@figentra/web",
};

test("a name declared in two packages is a finding naming both", () => {
  const root = workspace(MEMBERS, {
    "packages/foundation/support/src/core/functions/escape-html.function.ts":
      "export function escapeHtml(value: unknown): string {\n  return String(value);\n}\n",
    "packages/data/documents/src/core/functions/escape-html.function.ts":
      "export function escapeHtml(text: string): string {\n  return text;\n}\n",
  });
  assert.deepEqual(duplicateExportFindings(root, {}, {}), [
    {
      dir: "packages/data/documents",
      text:
        "exported name escapeHtml is declared in @stackra/documents (packages/data/documents/src/core/functions/escape-html.function.ts), " +
        "@stackra/support (packages/foundation/support/src/core/functions/escape-html.function.ts): give it one home and import it " +
        "(helpers go to @stackra/support), or add it to ALLOWED in tools/scripts/duplicate-exports.mjs with the reason",
    },
  ]);
});

test("re-exports, tests, declaration files, apps and one package's value and type of one name do not count", () => {
  const root = workspace(MEMBERS, {
    "packages/foundation/support/src/core/functions/escape-html.function.ts":
      "export function escapeHtml(value: unknown): string {\n  return String(value);\n}\n",
    "packages/experience/experience/src/edge/index.ts":
      'export { escapeHtml } from "@stackra/support";\nexport type { Theme } from "#core/types/theme.type";\n',
    "packages/experience/experience/src/edge/functions/__tests__/fake.test.ts":
      "export const escapeHtml = () => '';\n",
    "packages/experience/experience/src/edge/types/globals.d.ts":
      "export declare const escapeHtml: string;\n",
    "apps/web/src/escape-html.ts": "export const escapeHtml = 1;\n",
    "packages/data/documents/src/core/enums/tone.enum.ts":
      "export const Tone = Enum.of({});\nexport type Tone = Enum.Value<typeof Tone>;\n",
  });
  assert.deepEqual([...duplicateExports(root).keys()], []);
  assert.deepEqual(duplicateExportFindings(root, {}, {}), []);
});

test("every declaration form counts, const enum and abstract class included", () => {
  const forms = [
    "export const enum Kind { A }",
    "export abstract class Kind {}",
    "export interface Kind {}",
    "export declare namespace Kind {}",
    "export async function Kind() {}",
  ];
  for (const form of forms) {
    const root = workspace(MEMBERS, {
      "packages/foundation/support/src/core/a.ts": `${form}\n`,
      "packages/data/documents/src/core/b.ts": "export type Kind = string;\n",
    });
    assert.deepEqual([...duplicateExports(root).keys()], ["Kind"], form);
  }
});

test("ALLOWED and PENDING exempt a name, and stale entries are listed", () => {
  const root = workspace(MEMBERS, {
    "packages/foundation/support/src/core/a.ts": "export const one = 1;\nexport const two = 2;\n",
    "packages/data/documents/src/core/b.ts": "export const one = 1;\nexport const two = 2;\n",
  });
  assert.equal(
    duplicateExportFindings(root, { one: "intended" }, { two: "stackra-225" }).length,
    0,
  );
  assert.equal(duplicateExportFindings(root, { one: "intended" }, {}).length, 1);
  assert.deepEqual(staleAllowListEntries(root, { one: "x", gone: "x" }, { two: "y", old: "y" }), [
    "gone",
    "old",
  ]);
});

test("a PENDING entry whose duplicate is gone is a finding, so the list only shrinks", () => {
  const root = workspace(MEMBERS, {
    "packages/foundation/support/src/core/a.ts": "export const one = 1;\n",
    "packages/data/documents/src/core/b.ts": "export const one = 1;\nexport const solo = 2;\n",
  });
  assert.deepEqual(duplicateExportFindings(root, {}, { one: "stackra-225", solo: "stackra-225" }), [
    {
      dir: "tools/scripts",
      text: "PENDING name solo is no longer declared in two packages: delete it from PENDING in duplicate-exports.mjs",
    },
  ]);
  assert.deepEqual(duplicateExportFindings(root, { gone: "intended" }, { one: "stackra-225" }), []);
});

test("the shipped lists never exempt a helper stackra-224 gave one home", () => {
  for (const name of [
    "ageOn",
    "base64url",
    "camelCase",
    "canonicalJson",
    "crc32",
    "decodeBase64",
    "escapeHtml",
    "escapeXml",
    "htmlToText",
    "isRecord",
    "snakeCase",
  ]) {
    assert.equal(Object.hasOwn(ALLOWED, name) || Object.hasOwn(PENDING, name), false, name);
  }
  for (const reason of Object.values(ALLOWED)) assert.ok(reason.length > 20);
});
