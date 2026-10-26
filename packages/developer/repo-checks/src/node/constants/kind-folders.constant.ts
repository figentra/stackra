/**
 * Stackra file contract:
 * Purpose: `KIND_FOLDERS`, the pre-v3 kind folders (ADR 0126, 0128, 0130): folder, file suffix and required test tier. The v3
 *          tables replace them; STA-340 rebuilds the checks that still read this list.
 * Boundary: data only; read by `kindOfFile`, the suffix lookups and the doc-standard migration rule.
 * Runtime: node
 * Governing contract: ADR 0126; ADR 0128; ADR 0130; the ADR named on each row.
 */
import type { KindFolder } from "#node/types/kind-folder.type";

/** One row: folder, suffix, required test tier, reason, ADR. */
type KindRow = readonly [string, string | null, string | null, string, string];

const ROWS: readonly KindRow[] = [
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
];

/** Pre-v3 kind folders (ADR 0126, 0128, 0130), each with its file suffix and required test tier. */
export const KIND_FOLDERS: readonly KindFolder[] = Object.freeze(
  ROWS.map(([folder, suffix, test, reason, adr]) => ({ folder, suffix, test, reason, adr })),
);
