import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parseEntries, scaffold } from "../scaffold.mjs";
import {
  CATEGORY_NAMES,
  ENTRY_NAMES,
  OPTIONAL_ENTRY_NAMES,
  categoryOf,
  renderStructureDoc,
} from "../structure.mjs";
import { checkTestPlacement } from "../validate-repository.mjs";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const SCRIPTS = join(ROOT, "tools/scripts");
const tmp = () => mkdtempSync(join(tmpdir(), "structure-"));

test("the category list is the 13 categories, and every category folder on disk is one of them", () => {
  const onDisk = readdirSync(join(ROOT, "packages"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "tooling")
    .map((d) => d.name);
  assert.equal(CATEGORY_NAMES.length, 13);
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
  assert.match(
    readFileSync(join(SCRIPTS, "validate-repository.mjs"), "utf8"),
    /from "\.\/repo-checks\.mjs"/,
  );
  for (const file of ["scaffold.mjs", "validate-repository.mjs"]) {
    const source = readFileSync(join(SCRIPTS, file), "utf8");
    if (file === "scaffold.mjs") assert.match(source, /from "\.\/structure\.mjs"/, file);
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

test("the standards page is the generated output, and docs.json links it", () => {
  const page = join(ROOT, "apps/docs/src/standards/structure.mdx");
  assert.ok(existsSync(page), "run node tools/scripts/structure.mjs --write-docs");
  assert.equal(readFileSync(page, "utf8"), renderStructureDoc());
  assert.match(
    readFileSync(join(ROOT, "apps/docs/src/docs.json"), "utf8"),
    /"standards\/structure"/,
  );
});
