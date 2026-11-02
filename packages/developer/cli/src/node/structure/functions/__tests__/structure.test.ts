/**
 * Stackra file contract:
 * Purpose: hold `stackra structure` (was `structure.mjs`) and the scaffold to the structure tables: the categories on disk, scaffold writing
 *          every category under `packages/<category>/<name>`, and the entries in exports order.
 * Boundary: reads this checkout and renders into temp directories; writes nothing here.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy). ADR 0294.
 */
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "@stackra/testing";

import {
  CATEGORY_NAMES,
  ENTRY_NAMES,
  OPTIONAL_ENTRY_NAMES,
  categoryOf,
  checkTestPlacement,
} from "@stackra/repo-checks/node";

import { parseEntries } from "#node/scaffold/functions/parse-entries.function";
import { scaffold } from "#node/scaffold/functions/scaffold.function";
import { renderStructureDoc } from "#node/structure/functions/render-structure-doc.function";

const ROOT = fileURLToPath(new URL("../../../../../../../../", import.meta.url));
const NODE = join(ROOT, "packages/developer/cli/src/node");
const tmp = () => mkdtempSync(join(tmpdir(), "structure-"));

test("the category list is the 14 categories, and every category folder on disk is one of them", () => {
  const onDisk = readdirSync(join(ROOT, "packages"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "tooling")
    .map((d) => d.name);
  assert.equal(CATEGORY_NAMES.length, 14);
  for (const name of onDisk) assert.ok(CATEGORY_NAMES.includes(name), name);
});

test("scaffold accepts exactly the structure categories and writes them under packages/<category>", () => {
  for (const category of CATEGORY_NAMES) {
    const { rel } = scaffold({
      kind: "package",
      name: "sample",
      root: tmp(),
      category,
      entries: [],
      description: "Sample.",
      summary: "Reach for it in tests.",
      dryRun: true,
    });
    assert.equal(rel, `packages/${category}/sample`);
    assert.equal(categoryOf(rel), category);
  }
  assert.throws(
    () =>
      scaffold({
        kind: "package",
        name: "sample",
        root: tmp(),
        category: "tooling",
        description: "Sample.",
        dryRun: true,
      }),
    /--category/,
  );
});

test("scaffold writes every category to packages/<category>/<name> on disk", () => {
  for (const category of CATEGORY_NAMES) {
    const root = tmp();
    const { rel } = scaffold({
      kind: "package",
      name: "sample",
      root,
      category,
      description: "Sample.",
      summary: "Reach for it in tests.",
      format: false,
    });
    assert.equal(rel, `packages/${category}/sample`);
    assert.ok(existsSync(join(root, rel, "package.json")), rel);
    assert.equal(categoryOf(rel), category);
  }
});

test("entries parse in exports order and reject unknown names", () => {
  assert.deepEqual(parseEntries(ENTRY_NAMES), OPTIONAL_ENTRY_NAMES);
  assert.deepEqual(parseEntries("native,contracts,react"), ["react", "native"]);
  assert.throws(() => parseEntries("web"), /unknown entry/);
});

test("scaffold imports the lists and declares none of its own; the validator wraps @stackra/repo-checks", () => {
  for (const file of [
    "scaffold/functions/scaffold.function.ts",
    "constants/validate-command.constant.ts",
  ]) {
    const source = readFileSync(join(NODE, file), "utf8");
    assert.match(source, /from "@stackra\/repo-checks\/node"/, file);
    assert.doesNotMatch(
      source,
      /export const (CATEGORIES|ENTRIES)\b|const (CATEGORIES|ENTRIES) =/,
      file,
    );
  }
});

test("the validator's stories and test-file rules come from structure", () => {
  assert.deepEqual(checkTestPlacement(["packages/x/src/button.stories.tsx"]), [
    "packages/x/src/button.stories.tsx: no Storybook; test the component in __tests__/",
  ]);
  assert.deepEqual(checkTestPlacement(["packages/x/src/__tests__/a.test.ts"]), []);
  assert.equal(checkTestPlacement(["packages/x/src/a.test.ts"]).length, 1);
});

test("the standards page is the generated output, and the docs config lists it", () => {
  const page = join(ROOT, "apps/docs/src/docs/standards/structure.mdx");
  assert.ok(existsSync(page), "run stackra structure --write-docs");
  assert.equal(readFileSync(page, "utf8"), renderStructureDoc());
  assert.match(
    readFileSync(join(ROOT, "apps/docs/src/config/docs.config.ts"), "utf8"),
    /"standards\/structure"/,
  );
});
