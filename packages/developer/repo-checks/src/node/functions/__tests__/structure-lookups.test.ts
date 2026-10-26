/**
 * Stackra file contract:
 * Purpose: unit tests of the structure tables and their lookups (`categoryOf`, `rootModuleOf`, `groupsFor`,
 *          `kindOfFile`, `folderForSuffix`, `requiredTestFor`, `testFileFor`, `isBannedFolder`), moved from
 *          tools/scripts/__tests__/structure.test.mjs with their cases unchanged. The scaffold, on-disk and docs-page
 *          cases stay there.
 * Boundary: test only; pure data, no disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decisions 13 to 15, rules R1 and R12); ADR 0127; ADR 0022 (test placement).
 */
import assert from "node:assert/strict";

import { test } from "@stackra/testing";

import { APP_GROUPS } from "#node/constants/app-groups.constant";
import { BANNED_FOLDERS } from "#node/constants/banned-folders.constant";
import { CATEGORIES } from "#node/constants/categories.constant";
import { CATEGORY_NAMES } from "#node/constants/category-names.constant";
import { ENTRIES } from "#node/constants/entries.constant";
import { ENTRY_NAMES } from "#node/constants/entry-names.constant";
import { EXPLORER } from "#node/constants/explorer.constant";
import { KIND_FOLDERS } from "#node/constants/kind-folders.constant";
import { MEMBER_ROOT } from "#node/constants/member-root.constant";
import { MODULE_GROUPS } from "#node/constants/module-groups.constant";
import { OPTIONAL_ENTRY_NAMES } from "#node/constants/optional-entry-names.constant";
import { PACKAGE_FOLDERS } from "#node/constants/package-folders.constant";
import { REACT_HOOK } from "#node/constants/react-hook.constant";
import { ROOT_MODULE } from "#node/constants/root-module.constant";
import { TEST_TIERS } from "#node/constants/test-tiers.constant";
import { categoryOf } from "#node/functions/category-of.function";
import { folderForSuffix } from "#node/functions/folder-for-suffix.function";
import { groupsFor } from "#node/functions/groups-for.function";
import { isBannedFolder } from "#node/functions/is-banned-folder.function";
import { kindOfFile } from "#node/functions/kind-of-file.function";
import { requiredTestFor } from "#node/functions/required-test-for.function";
import { rootModuleOf } from "#node/functions/root-module-of.function";
import { testFileFor } from "#node/functions/test-file-for.function";
import type { StructureGroup } from "#node/types/structure-group.type";

/** The entry a package folder feeds. */
const entryOf = (folder: string): string | undefined =>
  PACKAGE_FOLDERS.find((f) => f.folder === folder)?.entry;

/** The suffixes a group table lists more than once. */
const twice = (table: readonly StructureGroup[]): string[] => {
  const seen = table.flatMap((g) => g.suffixes);
  return [...new Set(seen.filter((s, i) => seen.indexOf(s) !== i))];
};

test("the category list is the 13 categories", () => {
  assert.equal(CATEGORY_NAMES.length, 13);
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
    assert.ok(row.reason.length > 0 && row.adr, JSON.stringify(row));
});

test("categoryOf reads packages/<category>/<name> and packages/tooling/<name>", () => {
  assert.equal(categoryOf("packages/cross-cutting/brand"), "cross-cutting");
  assert.equal(categoryOf("packages/design-system/tokens"), "design-system");
  assert.equal(categoryOf("packages/tooling/oxlint"), "tooling");
  assert.equal(categoryOf("packages/nope/x"), null);
  assert.equal(categoryOf("apps/console"), null);
});

// @covers sta-347:FR-006 sta-347:P-005
test("v3 entries are the six of ADR 0294 decision 23; only react and native are optional", () => {
  assert.deepEqual(ENTRY_NAMES, ["contracts", "node", "react", "native", "testing"]);
  assert.deepEqual(OPTIONAL_ENTRY_NAMES, ["react", "native"]);
  for (const { entry } of PACKAGE_FOLDERS.filter((f) => f.entry !== "."))
    assert.ok(ENTRY_NAMES.includes(entry.slice(2)), entry);
  // A host subclasses a package's config class, so `.` exports config/ beside core/ (ADR 0294 d19, STA-347).
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

test("kindOfFile maps names to kinds, hooks and the root module", () => {
  assert.equal(kindOfFile("create-user.action.ts")?.folder, "actions");
  assert.equal(kindOfFile("user.model.ts")?.test, "int");
  assert.equal(kindOfFile("cart.hook.ts")?.folder, "hooks");
  assert.equal(kindOfFile("currency.enum.ts")?.folder, "enums");
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
  assert.equal(requiredTestFor("module"), "int");
});

test("testFileFor builds the tier infix and rejects unknown tiers", () => {
  assert.equal(testFileFor("create-user.action", "unit"), "create-user.action.test.ts");
  assert.equal(testFileFor("billing.module", "int"), "billing.module.int.test.ts");
  assert.equal(testFileFor("app-manifest", "contract"), "app-manifest.contract.test.ts");
  assert.equal(testFileFor("ingest", "load"), "ingest.load.test.ts");
  assert.throws(() => testFileFor("x", "smoke"), /unknown test tier/);
});

test("banned folders and kind folders never overlap", () => {
  for (const { folder } of KIND_FOLDERS)
    assert.equal(isBannedFolder(folder ?? ""), false, folder ?? "");
  for (const name of ["controllers", "dtos", "repositories", "helpers", "utils", "presentation"])
    assert.equal(isBannedFolder(name), true, name);
});

test("kind suffixes are unique", () => {
  const suffixes = KIND_FOLDERS.map((k) => k.suffix).filter(Boolean);
  assert.equal(new Set(suffixes).size, suffixes.length);
});
