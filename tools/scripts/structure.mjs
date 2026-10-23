#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the one machine-readable source of repository structure: package categories, package entries, the
 *          programming model v3 tables (module groups, app groups, package folders, member root; ADR 0294, 0295),
 *          the pre-v3 kind folders, banned folders, suffix → folder, suffix → required test, test-tier infixes and
 *          documented exceptions. scaffold.mjs and validate-repository.mjs import it instead of keeping their own
 *          lists, and `--write-docs` renders apps/docs/src/standards/structure.mdx from it.
 * Scope: plain data and small lookup functions. It runs no checks; findings stay in validate-repository.mjs.
 * Owner: code-standards-steward · Secrets: forbidden
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const DOC_PATH = join(ROOT, "apps/docs/src/standards/structure.mdx");

/**
 * @typedef {object} Rule
 * @property {string} name - the folder, category, entry or tier name
 * @property {string} reason - one line, why the rule exists
 * @property {string} adr - the ADR (or settlement item) it comes from
 */

/**
 * A kind folder under `src/` (ADR 0126 d3, 0128 d4, 0130). `suffix` is the file kind (`<subject>.<suffix>.ts`, null
 * when files carry no kind suffix); `test` is the tier of the test a file of that kind requires (null: none).
 * @typedef {object} KindFolder
 * @property {string} folder - the folder name under src/, or the module it names
 * @property {string | null} suffix - the file kind, or null when files carry no suffix
 * @property {string | null} test - the required test tier, or null when none is required
 * @property {string} reason - one line, why the rule exists
 * @property {string} adr - the ADR or settlement item it comes from
 */

/** Package categories under `packages/<category>/<name>`, one per member (ADR 0127, settlement Q3.2). */
export const CATEGORIES = Object.freeze([
  {
    name: "foundation",
    reason: "contracts, validation and errors every layer imports",
    adr: "0127",
  },
  { name: "application", reason: "actions, AI, IR and the registry", adr: "0127" },
  {
    name: "communication",
    reason: "webhooks, versioning, integrations and mail",
    adr: "0127, 0270",
  },
  { name: "commerce", reason: "money, ledger and pricing primitives", adr: "0127" },
  {
    name: "cross-cutting",
    reason: "brand and concerns that span layers (settlement Q3.1)",
    adr: "0127",
  },
  {
    name: "data",
    reason: "model, database, content, media, search, assets, filesystem, storage",
    adr: "0127",
  },
  { name: "developer", reason: "CLI, gen, coding standard and the Vite plugin", adr: "0127" },
  {
    name: "experience",
    reason: "UI, experience, navigation, console, panel, builder and collaboration",
    adr: "0127, 0270",
  },
  { name: "infrastructure", reason: "Pulumi-based packages named `infra-<name>`", adr: "0127" },
  {
    name: "runtime",
    reason: "outbox, queue, scheduler, workflow, realtime, locking and cache",
    adr: "0127",
  },
  {
    name: "security",
    reason: "identity, IAM, tenancy, connections, entitlements and licensing",
    adr: "0127",
  },
  { name: "state", reason: "settings, feature flags and theming", adr: "0127" },
]);

/** The category name list, for lookups and messages. */
export const CATEGORY_NAMES = Object.freeze(CATEGORIES.map((c) => c.name));

/** Tooling presets sit under `packages/tooling/<name>` and carry tier:config, not a package category (ADR 0003). */
export const TOOLING = Object.freeze({
  name: "tooling",
  tier: "tier:config",
  reason: "build, lint and test presets with no workspace dependencies",
  adr: "0003",
});

/**
 * Package entries besides core `.`, in exports order (ADR 0294 decisions 15 and 23). `optional` entries are scaffolded
 * only on request (`--entries react,native`); the others come with every package. An entry is exported once its folder
 * holds a file; the barrels are generated, never authored.
 */
export const ENTRIES = Object.freeze([
  {
    name: "contracts",
    optional: false,
    reason: "the leaf: `ports/`, `enums/` and `types/`; imports nothing else from the package",
    adr: "0294 d15",
  },
  {
    name: "node",
    optional: false,
    reason: "the module folder: the root module and the module groups",
    adr: "0294 d15",
  },
  { name: "react", optional: true, reason: "web renderers in `react/<name>/`", adr: "0294 d15" },
  {
    name: "native",
    optional: true,
    reason: "native renderers in `native/<name>/`",
    adr: "0294 d15",
  },
  {
    name: "testing",
    optional: false,
    reason: "`fakes/` and `matchers/` for consumers' tests",
    adr: "0294 d15",
  },
]);

/** Named exception to ENTRIES: `@stackra/testing` alone also has these two entries, and no other package does (ADR 0269 d6). */
const TESTING_PACKAGE_ENTRIES = Object.freeze([
  { name: "e2e", reason: "end-to-end tier helpers", adr: "0269" },
  { name: "contract", reason: "contract tier helpers", adr: "0269" },
]);

/** The entry name list, in exports order. */
export const ENTRY_NAMES = Object.freeze(ENTRIES.map((e) => e.name));
/** The entries `--entries` may add; the others come with every package. */
export const OPTIONAL_ENTRY_NAMES = Object.freeze(
  ENTRIES.filter((e) => e.optional).map((e) => e.name),
);

/**
 * A v3 group folder (ADR 0294 decisions 13 and 14): the folder under a module or an app's `src/`, and the kind
 * suffixes whose one home it is (`<name>.<suffix>.ts(x)`). `<name>` in a group is a folder named after its subject.
 * @typedef {object} Group
 * @property {string} group - the folder path inside the scope; "" for the scope's root
 * @property {readonly string[]} suffixes - the kind suffixes it holds; empty for function kinds with no suffix
 * @property {string} reason - one line, what it holds
 * @property {string} adr - the ADR decision it comes from
 */

/** @param {[string, string[], string][]} rows @param {string} adr @returns {readonly Group[]} */
const groups = (rows, adr) =>
  Object.freeze(rows.map(([group, suffixes, reason]) => ({ group, suffixes, reason, adr })));

/**
 * The groups of a module: `src/modules/<key>/` in a service, `src/node/` in a package (ADR 0294 decision 13). A group
 * folder appears with its first file. `.change.ts` is the one suffix with two homes (rule R1).
 */
export const MODULE_GROUPS = groups(
  [
    ["", ["module", "settings"], "the module file, its one settings group and `README.md`"],
    ["models", ["model", "state-machine", "bucket", "projection"], "persisted models"],
    ["actions", ["action"], "write operations"],
    ["queries", ["query"], "read operations"],
    ["schemas", ["schema", "change"], "shapes shared by two files; dated response changes"],
    ["enums", ["enum"], "`Enum.of` enums"],
    ["errors", ["error"], "Refusal classes"],
    ["events", ["event", "change"], "events and their versions"],
    ["listeners", ["listener"], "event handlers"],
    ["workflows", ["workflow", "signal"], "durable runs and the signals they wait for"],
    [
      "access",
      ["permissions", "policy", "role", "entitlement", "precondition", "flag"],
      "who may do what, and when",
    ],
    ["services", ["service", "repository"], "services; a repository only for named reads"],
    ["drivers", ["driver"], "port implementations"],
    ["extensions", ["extension-point", "extension", "interceptor"], "extension points and wraps"],
    ["raw", ["controller"], "raw endpoints, in a service only (ADR 0130 decision 3)"],
    [
      "resources/<model>",
      ["resource", "widget", "document", "notification", "mail"],
      "one model's admin surface",
    ],
    ["database/migrations", ["migration"], "`NNNN-<name>.migration.ts`, numbered per module"],
    ["database/factories", ["factory"], "`<model>.factory.ts`"],
    ["database/seeders", ["seeder"], "minimal, demo and test seeders"],
    ["ai", ["prompt", "skill", "facts"], "prompts, skills and facts"],
    ["functions", ["function"], "plain functions"],
    ["constants", ["constant"], "module-level constants"],
    ["types", ["type"], "types two or more files import"],
  ],
  "0294 d13",
);

/** The groups of an app's `src/` (ADR 0294 decision 14). */
export const APP_GROUPS = groups(
  [
    ["", ["module", "error"], "`<key>.module.ts` and `app.error.tsx`, the root error boundary"],
    ["config", ["config"], "config classes, including `desktop.config.ts` and `chrome.config.ts`"],
    ["panels", ["panel"], "app areas"],
    ["menus", ["menu"], "navigation data"],
    ["shortcuts", ["shortcut"], "palette and key entries"],
    ["documents", ["document"], "document kinds"],
    ["stores", ["store"], "client state classes"],
    ["flags", ["flag"], "release switches"],
    ["analytics", ["analytics-event"], "analytics events"],
    ["bridges", ["bridge"], "desktop bridges"],
    [
      "routes/<name>",
      ["route", "layout", "error", "fallback", "server"],
      "a route or layout class, its page `<name>.tsx`, `use-<name>.ts` and `__tests__/`",
    ],
    ["blocks/<name>", ["block"], "`<name>.block.ts`, its renderer `<name>.tsx` and `__tests__/`"],
    [
      "components/<name>",
      [],
      "`<name>.tsx`, `index.ts` (the component and its Props) and `__tests__/`",
    ],
    ["hooks", [], "`use-<name>.ts` with two or more importers"],
    ["overrides/<owner>", ["override"], "block and widget overrides"],
    ["providers/<name>", [], "only for the `Module({ wrap })` escape hatch"],
    ["enums", ["enum"], "`Enum.of` enums"],
    ["types", ["type"], "shared types"],
    ["styles", [], "stylesheets (`.css`)"],
  ],
  "0294 d14",
);

/**
 * The folders of a package's `src/` (ADR 0294 decision 15). `entry` is the subpath the folder feeds, or null for a
 * folder no entry exports. Dependencies run one way: core imports contracts; node, react and native import core;
 * testing imports them all. Which entry exports `config/` is not settled (ADR 0177 amendment).
 */
export const PACKAGE_FOLDERS = Object.freeze(
  [
    ["contracts", "./contracts", "the leaf: `ports/`, `enums/` and `types/`"],
    ["config", null, "the config classes"],
    ["core", ".", "isomorphic code: services, drivers, errors, functions, schemas and blocks"],
    ["node", "./node", "the module folder: `<key>.module.ts` and the module groups"],
    ["react/<name>", "./react", "web renderers"],
    ["native/<name>", "./native", "native renderers"],
    ["testing", "./testing", "`fakes/` and `matchers/`"],
  ].map(([folder, entry, reason]) => ({ folder, entry, reason, adr: "0294 d15" })),
);

/**
 * What every member authors at its root (ADR 0294 rule R12, ADR 0295 decisions 1 and 7): `stackra.config.ts` and one
 * root module; never `src/main.ts` or an entry barrel. The docs app and the `tier:config` presets are exempt.
 */
export const MEMBER_ROOT = Object.freeze({
  config: "stackra.config.ts",
  rootModule: "src/<name>.module.ts",
  packageRootModule: "src/node/<name>.module.ts",
  exempt: Object.freeze(["the docs app (Mintlify)", "the `tier:config` presets"]),
  reason: "one member shape; gen writes the entries, the tool configs and the barrels",
  adr: "0294 R12, 0295",
});

/**
 * The root module a member authors, from its directory: `src/node/<name>.module.ts` in a package,
 * `src/<name>.module.ts` elsewhere; null for a `tier:config` preset, which holds no module.
 * @param {string} dir - repository-relative, forward slashes
 * @returns {string | null}
 */
export function rootModuleOf(dir) {
  const name = dir.split("/").at(-1);
  if (dir.startsWith(`packages/${TOOLING.name}/`)) return null;
  const pattern = dir.startsWith("packages/")
    ? MEMBER_ROOT.packageRootModule
    : MEMBER_ROOT.rootModule;
  return pattern.replace("<name>", name);
}

/**
 * The v3 home groups of a kind suffix, in modules and in apps (empty when no group holds it).
 * @param {string} suffix - for example `action` or `change`
 * @returns {{ module: string[], app: string[] }}
 */
export function groupsFor(suffix) {
  const homes = (table) => table.filter((g) => g.suffixes.includes(suffix)).map((g) => g.group);
  return { module: homes(MODULE_GROUPS), app: homes(APP_GROUPS) };
}

/**
 * Pre-v3 kind folders (ADR 0126, 0128, 0130). The v3 tables above replace them; STA-340 rebuilds the checks that
 * still read this list (doc-standard's migration rule, `kindOfFile`).
 * @type {readonly KindFolder[]}
 */
export const KIND_FOLDERS = Object.freeze(
  [
    [
      "actions",
      "action",
      "unit",
      "one action per file; its test covers the happy path and one refusal",
      "0098",
    ],
    ["queries", "query", "unit", "read-only operations", "0126"],
    ["models", "model", "int", "persistence models; their tests need the real database", "0014"],
    ["migrations", "migration", null, "schema changes, applied in order", "0014"],
    ["seeds", "seed", null, "seed data for local and test databases", "0014"],
    ["factories", "factory", null, "test-data factories", "0022"],
    ["policies", "policy", "unit", "authorisation rules, one case per verb", "0130"],
    [
      "permissions",
      "permission",
      "contract",
      "declared permission names, covered by the member manifest test",
      "0130",
    ],
    [
      "settings",
      "setting",
      "contract",
      "declared settings, covered by the member manifest test",
      "0130",
    ],
    [
      "events",
      "event",
      "contract",
      "versioned event declarations, covered by the member manifest test",
      "0141",
    ],
    ["listeners", "listener", "unit", "@OnEvent handlers, one toEmit case each", "0264 d8"],
    ["workflows", "workflow", "int", "durable, compensating workflows", "0130"],
    [
      "services",
      "service",
      "unit",
      "application services that actions and listeners depend on",
      "0264 d10",
    ],
    [
      "hooks",
      "hook",
      "unit",
      "extension hooks only; React hooks are `use-*.ts` files, not a folder",
      "0264 d7",
    ],
    ["links", "link", null, "named links between modules (purpose not yet specified)", "0264 d7"],
    [
      "drivers",
      "driver",
      "unit",
      "port drivers; the memory driver is unit, a real one also needs int",
      "0264 d7",
    ],
    ["widgets", "widget", "unit", "UI widgets; the test sits beside the component", "0264 d7"],
    ["pages", "page", "unit", "route pages", "0264 d7"],
    [
      "resources",
      "resource",
      "unit",
      "admin-UI @Resource declarations; the word resource is reserved for them",
      "0234",
    ],
    ["ai", null, null, "AI code: prompts, tools and agents", "0264 d7"],
    [
      "raw",
      null,
      "unit",
      "raw @Controller endpoints only: webhooks, streaming and the /api/auth paths; actions never use it",
      "0130",
    ],
    [
      "decorators",
      null,
      "unit",
      "decorator packages with their Explorer (backend-decorator-package skill)",
      "0130",
    ],
    [
      "contracts",
      null,
      "contract",
      "vocabulary under src/contracts/, used by the package entry of that name",
      "0117",
    ],
    [
      "config",
      "config",
      "contract",
      "typed configuration inside src/config/, not beside src",
      "0025",
    ],
    ["interfaces", "interface", "contract", "type-only shapes", "0128"],
    ["types", "type", "contract", "type aliases and unions", "0128"],
    ["tokens", "token", "contract", "DI tokens made with defineToken", "0231"],
    ["constants", "constant", "contract", "module-level constants, SCREAMING_SNAKE", "0231"],
    [
      "enums",
      "enum",
      "contract",
      "const-object enums with a same-named union type; the enum keyword is banned",
      "0130",
    ],
    ["errors", "error", "contract", "StackraError subclasses", "0232"],
    ["schemas", "schema", "contract", "Zod schemas", "0095"],
    [
      "internal",
      null,
      "unit",
      "helpers shared by two or more files of one package; never exported from a barrel; test in `internal/__tests__/`",
      "0006",
    ],
    [
      "components",
      null,
      "unit",
      "components as folders: `components/<name>/<name>.tsx` with its `__tests__` beside it",
      "0128",
    ],
  ].map(([folder, suffix, test, reason, adr]) => ({ folder, suffix, test, reason, adr })),
);

/**
 * The root module of a member, `src/<name>.module.ts`. Its test is the integration tier (settlement contradiction 8).
 * @type {KindFolder}
 */
export const ROOT_MODULE = Object.freeze({
  folder: null,
  suffix: "module",
  test: "int",
  reason: "a member's root module; its test creates the module through createTestingModule",
  adr: "0090",
});

/**
 * React hooks: `use-<name>.ts` beside the component that uses them, or in `ui/` (settlement Q2.2). Test unit.
 * @type {KindFolder}
 */
export const REACT_HOOK = Object.freeze({
  folder: null,
  suffix: null,
  test: "unit",
  reason: "React hook file, beside its component; the file name starts with use-",
  adr: "0129",
});

/**
 * Static files shipped with a module live in `assets/` at the package root, not under `src/` (ADR 0177, ADR 0234 d2).
 * `lang` feeds the i18n registry; the other folders carry their own rules in ADR 0234.
 */
export const ASSETS = Object.freeze({
  location: "assets/ at the package root",
  folders: Object.freeze(["public", "lang", "templates", "stubs", "data"]),
  test: null,
  reason: "static files shipped with a module; the word resource is reserved for @Resource",
  adr: "0234",
});

/** Folders that may not exist anywhere in a member (ADR 0126 d3, ADR 0130 d4, settlement Q2.3). */
export const BANNED_FOLDERS = Object.freeze([
  {
    name: "controllers",
    reason: "raw endpoints live in raw/ only; actions are the unit",
    adr: "0130",
  },
  { name: "dtos", reason: "Zod schemas replace DTO classes", adr: "0095" },
  { name: "repositories", reason: "MikroORM models and queries replace repositories", adr: "0014" },
  { name: "helpers", reason: "name the kind the code serves instead", adr: "0126" },
  {
    name: "utils",
    reason: "shared pure functions go to @stackra/support or the kind they serve",
    adr: "0126",
  },
  { name: "presentation", reason: "there is no presentation layer folder", adr: "0130" },
]);

/**
 * Test tiers and the infix each one puts before `.ts` (ADR 0022, ADR 0182 d1). `e2e` tests live in the app, not in a
 * member (see EXCEPTIONS).
 */
export const TEST_TIERS = Object.freeze([
  { name: "unit", infix: ".test", reason: "fast, no external services", adr: "0182" },
  { name: "int", infix: ".int.test", reason: "needs a real database or container", adr: "0182" },
  {
    name: "contract",
    infix: ".contract.test",
    reason: "checks a declared contract, such as the manifest",
    adr: "0182",
  },
  {
    name: "load",
    infix: ".load.test",
    reason: "k6 load tests, run weekly against staging",
    adr: "0182",
  },
  { name: "e2e", infix: ".e2e.test", reason: "runs a whole app", adr: "0022" },
]);

/** Test files match `.test.` or `.spec.` (validator checks `.spec` separately). */
export const TEST_FILE_PATTERN = /\.(test|spec)\.[cm]?[jt]sx?$/;
/** A `.spec.` file: ADR 0022 uses `.test`, never `.spec`. */
export const SPEC_PATTERN = /\.spec\./;

/** Files that may not exist, with the message the validator prints (ADR 0126: no Storybook). */
export const FORBIDDEN_FILES = Object.freeze([
  {
    name: "stories",
    pattern: /\.stories\.[cm]?[jt]sx?$/,
    hint: "no Storybook; test the component in __tests__/",
    adr: "0126",
  },
]);

/**
 * Documented exceptions to the rules above. `required: false` on the manifest test exempts every member until M2
 * (gen does not exist before W6; settlement L7 and plan section 4).
 */
export const MANIFEST_CONTRACT_TEST = Object.freeze({
  file: "app-manifest.contract.test.ts",
  tier: "contract",
  required: false,
  until: "M2",
  reason: "gen does not exist before W6; flip required to true at M2",
  adr: "0182",
});

/** App e2e tests stay in the app (ADR 0022 d3; AGENTS.md "App e2e lives in the app"). */
export const APP_E2E = Object.freeze({
  pattern: "apps/<app>/e2e/__tests__/<name>.e2e.test.ts",
  reason: "app e2e lives in the app, a documented exception to the member test rule",
  adr: "0022",
});

/**
 * The kind of a source file, from its name: a root module, a React hook, or a `<subject>.<suffix>.ts(x)` file with
 * a known suffix. Returns null for anything else.
 * @param {string} fileName - a file name, no folder
 * @returns {KindFolder | null}
 */
export function kindOfFile(fileName) {
  if (/^use-[a-z0-9-]+\.tsx?$/.test(fileName)) return REACT_HOOK;
  const match = /\.([a-z]+)\.tsx?$/.exec(fileName);
  if (!match) return null;
  if (match[1] === ROOT_MODULE.suffix) return ROOT_MODULE;
  return KIND_FOLDERS.find((k) => k.suffix === match[1]) ?? null;
}

/**
 * The folder a suffix belongs in, or null when the suffix has no kind folder.
 * @param {string} suffix
 * @returns {string | null}
 */
export function folderForSuffix(suffix) {
  return KIND_FOLDERS.find((k) => k.suffix === suffix)?.folder ?? null;
}

/**
 * The test tier a suffix requires, or null when none is required.
 * @param {string} suffix
 * @returns {string | null}
 */
export function requiredTestFor(suffix) {
  if (suffix === ROOT_MODULE.suffix) return ROOT_MODULE.test;
  return KIND_FOLDERS.find((k) => k.suffix === suffix)?.test ?? null;
}

/**
 * The test file name for a subject in a tier: `subject` + the tier infix + `.ts`.
 * @param {string} subject - the file name without its extension, for example `create-user`
 * @param {string} tier - unit, int, contract or e2e
 * @returns {string}
 */
export function testFileFor(subject, tier) {
  const found = TEST_TIERS.find((t) => t.name === tier);
  if (!found)
    throw new Error(
      `unknown test tier "${tier}" — one of: ${TEST_TIERS.map((t) => t.name).join(", ")}`,
    );
  return `${subject}${found.infix}.ts`;
}

/**
 * True when a folder name is banned anywhere in a member.
 * @param {string} name
 * @returns {boolean}
 */
export function isBannedFolder(name) {
  return BANNED_FOLDERS.some((b) => b.name === name);
}

/**
 * The category of a package directory (`packages/<category>/<name>` or `packages/tooling/<name>`), or null.
 * @param {string} dir - repository-relative, forward slashes
 * @returns {string | null}
 */
export function categoryOf(dir) {
  const [top, category, name] = dir.split("/");
  if (top !== "packages" || !name) return null;
  if (category === TOOLING.name) return TOOLING.name;
  return CATEGORY_NAMES.includes(category) ? category : null;
}

/**
 * One markdown table cell: escapes the pipe, and wraps `__tests__` in a code span unless it already sits in one.
 * @param {unknown} text
 * @returns {string}
 */
const cell = (text) =>
  String(text ?? "")
    .split(/(`[^`]*`)/)
    .map((part, i) => (i % 2 ? part : part.replace(/__tests__\/?/g, (token) => `\`${token}\``)))
    .join("")
    .replace(/\|/g, "/");
/**
 * A value rendered as a code span, or `none` when there is no value.
 * @param {unknown} text
 * @returns {string}
 */
const code = (text) => (text === null || text === undefined ? "none" : `\`${text}\``);

/**
 * A markdown table with its columns padded to the widest cell, the layout oxfmt writes, so the generated page
 * is already formatted and the drift test compares bytes.
 * @param {string[]} headers
 * @param {string[][]} rows
 * @returns {string[]}
 */
function table(headers, rows) {
  const all = [headers, ...rows].map((r) => r.map(cell));
  const widths = headers.map((_, i) => Math.max(3, ...all.map((r) => r[i].length)));
  const line = (r) => `| ${r.map((c, i) => c.padEnd(widths[i])).join(" | ")} |`;
  return [
    line(all[0]),
    `| ${widths.map((w) => "-".repeat(w)).join(" | ")} |`,
    ...all.slice(1).map(line),
  ];
}

/**
 * A group table: the folder, the kind suffixes it holds, what it holds and its source.
 * @param {readonly Group[]} rows
 * @returns {string[]}
 */
const groupTable = (rows) =>
  table(
    ["Group", "Suffixes", "Holds", "Source"],
    rows.map((g) => [
      g.group ? code(`${g.group}/`) : "(root)",
      g.suffixes.map((s) => code(`.${s}`)).join(", ") || "none",
      g.reason,
      `ADR ${g.adr}`,
    ]),
  );

/**
 * The generated standards page. Every table is rendered from the data above, so the page cannot drift from the
 * lists the scaffold and the validator read.
 * @returns {string}
 */
export function renderStructureDoc() {
  const out = [
    "---",
    'title: "Repository structure"',
    'description: "The categories, kind folders, banned folders, file suffixes and test tiers every member follows, generated from tools/scripts/structure.mjs."',
    'icon: "sitemap"',
    "---",
    "",
    "{/* Generated by tools/scripts/structure.mjs (node tools/scripts/structure.mjs --write-docs). Do not edit by hand. */}",
    "",
    "The rules below are the single source for the scaffold (`pnpm new`) and the validator (`pnpm validate`). Each row names the ADR, or the settlement item, it comes from.",
    "",
    "## Package categories",
    "",
    "A package lives at `packages/<category>/<name>`. Tooling presets live at `packages/tooling/<name>` and carry `tier:config`.",
    "",
    ...table(
      ["Category", "Holds", "Source"],
      [
        ...CATEGORIES.map((c) => [code(c.name), c.reason, `ADR ${c.adr}`]),
        [code(TOOLING.name), `${TOOLING.reason} (${TOOLING.tier})`, `ADR ${TOOLING.adr}`],
      ],
    ),
    "",
    "## Package entries",
    "",
    "Core `.` is always present. An entry is exported once its folder holds a file, and its barrel is generated, never authored (ADR 0294 decision 15). `pnpm new package` adds the optional entries only with `--entries`.",
    "",
    ...table(
      ["Entry", "Scaffolded", "Holds", "Source"],
      ENTRIES.map((e) => [
        code(e.name),
        e.optional ? "on request" : "always",
        e.reason,
        `ADR ${e.adr}`,
      ]),
    ),
    "",
    `Exception: ${code("@stackra/testing")} alone also has ${TESTING_PACKAGE_ENTRIES.map((e) => code(e.name)).join(" and ")} (ADR 0269 d6). No other package does.`,
    "",
    "## Member root (programming model v3)",
    "",
    `Every member authors ${code(MEMBER_ROOT.config)} and one root module, ${code(MEMBER_ROOT.rootModule)} (${code(MEMBER_ROOT.packageRootModule)} in a package), and never ${code("src/main.ts")} or an entry barrel (ADR ${MEMBER_ROOT.adr}). Exempt: ${MEMBER_ROOT.exempt.join(" and ")}.`,
    "",
    "## Module groups (programming model v3)",
    "",
    "A module is `src/modules/<key>/` in a service and `src/node/` in a package. Each kind suffix has one home group; a group folder appears with its first file. The validator's `kind-path` check of these tables is planned (STA-338).",
    "",
    ...groupTable(MODULE_GROUPS),
    "",
    "## App groups (programming model v3)",
    "",
    ...groupTable(APP_GROUPS),
    "",
    "## Package folders (programming model v3)",
    "",
    ...table(
      ["Folder", "Entry", "Holds", "Source"],
      PACKAGE_FOLDERS.map((f) => [
        code(`src/${f.folder}/`),
        f.entry ? code(f.entry) : "not settled (ADR 0177 amendment)",
        f.reason,
        `ADR ${f.adr}`,
      ]),
    ),
    "",
    "## Kind folders (pre-v3)",
    "",
    "The pre-v3 list, still read by `kindOfFile` and the doc-standard migration rule until STA-340 rebuilds them on the tables above. A file's suffix names its kind; the test column is the tier its file needs.",
    "",
    ...table(
      ["Folder", "File suffix", "Required test", "Holds", "Source"],
      KIND_FOLDERS.map((k) => [
        code(k.folder),
        k.suffix ? code(`*.${k.suffix}.ts`) : "none",
        code(k.test),
        k.reason,
        `ADR ${k.adr}`,
      ]),
    ),
    "",
    `Root module: ${code("src/<name>.module.ts")}, test ${code(testFileFor("<name>.module", ROOT_MODULE.test))}, ADR ${ROOT_MODULE.adr}.`,
    "",
    `React hooks: ${code("use-<name>.ts")} beside their component, test ${code("use-<name>.test.ts")} (unit), ADR ${REACT_HOOK.adr}. Extension hooks are the only ${code("hooks/")} files.`,
    "",
    `Static files: ${code("assets/<kind>/")} at the package root (${code("public")}, ${code("lang")}, ${code("templates")}, ${code("stubs")}, ${code("data")}), ADR ${ASSETS.adr}. ${ASSETS.reason}.`,
    "",
    "## Banned folders",
    "",
    ...table(
      ["Folder", "Why", "Source"],
      BANNED_FOLDERS.map((b) => [code(b.name), b.reason, `ADR ${b.adr}`]),
    ),
    "",
    "## Test tiers",
    "",
    ...table(
      ["Tier", "File infix", "Holds", "Source"],
      TEST_TIERS.map((t) => [code(t.name), code(t.infix), t.reason, `ADR ${t.adr}`]),
    ),
    "",
    "Every test file sits directly in a `__tests__/` folder beside its subject (ADR 0022). `.spec.*` is not used.",
    "",
    "## Documented exceptions",
    "",
    ...table(
      ["Rule", "Why", "Source"],
      [
        [`App e2e: ${code(APP_E2E.pattern)}`, APP_E2E.reason, `ADR ${APP_E2E.adr}`],
        [
          `Manifest contract test: ${code(MANIFEST_CONTRACT_TEST.file)}`,
          `${MANIFEST_CONTRACT_TEST.reason}; required ${MANIFEST_CONTRACT_TEST.required ? "now" : `from ${MANIFEST_CONTRACT_TEST.until}`}`,
          `ADR ${MANIFEST_CONTRACT_TEST.adr}`,
        ],
      ],
    ),
    "",
    "## Forbidden files",
    "",
    ...table(
      ["Name", "Rule", "Source"],
      FORBIDDEN_FILES.map((f) => [code(f.name), f.hint, `ADR ${f.adr}`]),
    ),
    "",
  ];
  return out.join("\n");
}

/**
 * Writes the generated standards page. Returns the path written.
 * @param {string} [path]
 * @returns {string}
 */
export function writeStructureDoc(path = DOC_PATH) {
  if (!existsSync(dirname(path))) mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, renderStructureDoc());
  return path;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--write-docs")) console.log(`wrote ${writeStructureDoc()}`);
  else console.log(renderStructureDoc());
}
