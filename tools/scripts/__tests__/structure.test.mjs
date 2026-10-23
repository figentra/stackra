import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parseEntries, scaffold } from "../scaffold.mjs";
import {
  APP_GROUPS,
  BANNED_FOLDERS,
  CATEGORIES,
  ENTRIES,
  CATEGORY_NAMES,
  EXPLORER,
  ENTRY_NAMES,
  KIND_FOLDERS,
  MEMBER_ROOT,
  MODULE_GROUPS,
  OPTIONAL_ENTRY_NAMES,
  PACKAGE_FOLDERS,
  REACT_HOOK,
  ROOT_MODULE,
  TEST_TIERS,
  categoryOf,
  folderForSuffix,
  groupsFor,
  isBannedFolder,
  kindOfFile,
  renderStructureDoc,
  requiredTestFor,
  rootModuleOf,
  testFileFor,
} from "../structure.mjs";
import { checkTestPlacement } from "../validate-repository.mjs";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const SCRIPTS = join(ROOT, "tools/scripts");
const tmp = () => mkdtempSync(join(tmpdir(), "structure-"));

test("the category list is the 12 categories, and every category folder on disk is one of them", () => {
  const onDisk = readdirSync(join(ROOT, "packages"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "tooling")
    .map((d) => d.name);
  assert.equal(CATEGORY_NAMES.length, 12);
  for (const name of onDisk) assert.ok(CATEGORY_NAMES.includes(name), name);
});

test("every category and entry carries a reason and an ADR", () => {
  for (const row of [
    ...CATEGORIES,
    ...ENTRIES,
    ...KIND_FOLDERS,
    ...BANNED_FOLDERS,
    ...TEST_TIERS,
    ...MODULE_GROUPS,
    ...APP_GROUPS,
    ...PACKAGE_FOLDERS,
    MEMBER_ROOT,
    EXPLORER,
  ])
    assert.ok(row.reason?.length > 0 && row.adr, JSON.stringify(row));
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

test("categoryOf reads packages/<category>/<name> and packages/tooling/<name>", () => {
  assert.equal(categoryOf("packages/cross-cutting/brand"), "cross-cutting");
  assert.equal(categoryOf("packages/tooling/oxlint"), "tooling");
  assert.equal(categoryOf("packages/nope/x"), null);
  assert.equal(categoryOf("apps/console"), null);
});

test("entries parse in exports order and reject unknown names", () => {
  assert.deepEqual(parseEntries(ENTRY_NAMES), OPTIONAL_ENTRY_NAMES);
  assert.deepEqual(parseEntries("native,contracts,react"), ["react", "native"]);
  assert.throws(() => parseEntries("web"), /unknown entry/);
});

// @covers sta-347:FR-006 sta-347:P-005
test("v3 entries are the six of ADR 0294 decision 23; only react and native are optional", () => {
  assert.deepEqual(ENTRY_NAMES, ["contracts", "node", "react", "native", "testing"]);
  assert.deepEqual(OPTIONAL_ENTRY_NAMES, ["react", "native"]);
  for (const { entry } of PACKAGE_FOLDERS.filter((f) => f.entry !== "."))
    assert.ok(ENTRY_NAMES.includes(entry.slice(2)), entry);
  // A host subclasses a package's config class, so `.` exports config/ beside core/ (ADR 0294 d19, STA-347).
  const entryOf = (folder) => PACKAGE_FOLDERS.find((f) => f.folder === folder).entry;
  assert.equal(entryOf("config"), ".");
  assert.equal(entryOf("core"), ".");
});

// @covers sta-347:FR-006 sta-347:P-005
test("rootModuleOf places the root module by tier; the docs app and tooling presets have none (R12)", () => {
  assert.equal(rootModuleOf("packages/data/billing-core"), "src/node/billing-core.module.ts");
  assert.equal(rootModuleOf("services/notes"), "src/notes.module.ts");
  assert.equal(rootModuleOf("apps/admin"), "src/admin.module.ts");
  assert.equal(rootModuleOf("packages/tooling/oxlint"), null);
  assert.equal(rootModuleOf("apps/docs"), null);
  assert.equal(rootModuleOf("apps/docs-site"), "src/docs-site.module.ts");
  assert.equal(MEMBER_ROOT.config, "stackra.config.ts");
});

// @covers sta-347:FR-006 sta-347:P-005
test("every v3 suffix has one home per tier, except .change in modules and .error in apps (R1)", () => {
  const twice = (table) => {
    const seen = table.flatMap((g) => g.suffixes);
    return [...new Set(seen.filter((s, i) => seen.indexOf(s) !== i))];
  };
  assert.deepEqual(twice(MODULE_GROUPS), ["change"]);
  assert.deepEqual(twice(APP_GROUPS), ["error"]);
  assert.deepEqual(groupsFor("action"), { module: ["actions"], app: [] });
  assert.deepEqual(groupsFor("change"), { module: ["schemas", "events"], app: [] });
  assert.deepEqual(groupsFor("migration").module, ["database/migrations"]);
  assert.deepEqual(groupsFor("route"), { module: [], app: ["routes/<name>"] });
  assert.deepEqual(groupsFor("native"), { module: [], app: ["blocks/<name>"] });
  assert.equal(EXPLORER.suffix, "explorer");
  assert.deepEqual(groupsFor("nope"), { module: [], app: [] });
});

test("scaffold and validator import the lists and declare none of their own", () => {
  for (const file of ["scaffold.mjs", "validate-repository.mjs"]) {
    const source = readFileSync(join(SCRIPTS, file), "utf8");
    assert.match(source, /from "\.\/structure\.mjs"/, file);
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

test("kindOfFile maps names to kinds, hooks and the root module", () => {
  assert.equal(kindOfFile("create-user.action.ts").folder, "actions");
  assert.equal(kindOfFile("user.model.ts").test, "int");
  assert.equal(kindOfFile("cart.hook.ts").folder, "hooks");
  assert.equal(kindOfFile("currency.enum.ts").folder, "enums");
  assert.equal(kindOfFile("use-cart.ts"), REACT_HOOK);
  assert.equal(kindOfFile("billing.module.ts"), ROOT_MODULE);
  assert.equal(kindOfFile("create-user.test.ts"), null);
  assert.equal(kindOfFile("notes.md"), null);
});

test("suffix lookups give the folder and the required test tier", () => {
  assert.equal(folderForSuffix("schema"), "schemas");
  assert.equal(folderForSuffix("nope"), null);
  assert.equal(requiredTestFor("workflow"), "int");
  assert.equal(requiredTestFor("migration"), null);
});

test("testFileFor builds the tier infix and rejects unknown tiers", () => {
  assert.equal(testFileFor("create-user.action", "unit"), "create-user.action.test.ts");
  assert.equal(testFileFor("billing.module", "int"), "billing.module.int.test.ts");
  assert.equal(testFileFor("app-manifest", "contract"), "app-manifest.contract.test.ts");
  assert.equal(testFileFor("ingest", "load"), "ingest.load.test.ts");
  assert.throws(() => testFileFor("x", "smoke"), /unknown test tier/);
});

test("banned folders and kind folders never overlap", () => {
  for (const { folder } of KIND_FOLDERS) assert.equal(isBannedFolder(folder), false, folder);
  for (const name of ["controllers", "dtos", "repositories", "helpers", "utils", "presentation"])
    assert.equal(isBannedFolder(name), true, name);
});

test("kind suffixes are unique", () => {
  const suffixes = KIND_FOLDERS.map((k) => k.suffix).filter(Boolean);
  assert.equal(new Set(suffixes).size, suffixes.length);
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
