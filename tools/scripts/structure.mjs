#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the one machine-readable source of repository structure: package categories, package entries, kind
 *          folders, banned folders, suffix → folder, suffix → required test, test-tier infixes and documented
 *          exceptions. scaffold.mjs and validate-repository.mjs import it instead of keeping their own lists, and
 *          `--write-docs` renders apps/docs/src/standards/structure.mdx from it.
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

/** Optional package entries besides core `.`, in exports order (ADR 0126). Core is always present. */
export const ENTRIES = Object.freeze([
  { name: "contracts", reason: "vocabulary only: types, as-const objects and tokens", adr: "0117" },
  { name: "node", reason: "code that needs Node built-ins", adr: "0126" },
  { name: "react", reason: "React components and hooks", adr: "0126" },
  { name: "native", reason: "React Native code", adr: "0126" },
  { name: "testing", reason: "test helpers and fakes for consumers", adr: "0126" },
  { name: "devtools", reason: "developer tooling, only with real code", adr: "0126" },
]);

/** Named exception to ENTRIES: `@stackra/testing` alone also has these two entries, and no other package does (ADR 0269 d6). */
export const TESTING_PACKAGE_ENTRIES = Object.freeze([
  { name: "e2e", reason: "end-to-end tier helpers", adr: "0269" },
  { name: "contract", reason: "contract tier helpers", adr: "0269" },
]);

/** The entry name list, in exports order. */
export const ENTRY_NAMES = Object.freeze(ENTRIES.map((e) => e.name));

/** @type {readonly KindFolder[]} */
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
    "Core `.` is always present. Other entries are added only with real code (ADR 0126).",
    "",
    ...table(
      ["Entry", "Holds", "Source"],
      ENTRIES.map((e) => [code(e.name), e.reason, `ADR ${e.adr}`]),
    ),
    "",
    `Exception: ${code("@stackra/testing")} alone also has ${TESTING_PACKAGE_ENTRIES.map((e) => code(e.name)).join(" and ")} (ADR 0269 d6). No other package does.`,
    "",
    "## Kind folders",
    "",
    "Code of a module sits in these folders under `src/`. A file's suffix names its kind; the test column is the tier its file needs.",
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
