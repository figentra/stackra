/**
 * Stackra file contract:
 * Purpose: unit tests of `compileMigrations` against a hermetic host in a temp folder (a fake `@stackra/database`, a
 *          fake `@stackra/tenancy` shipping a migration and a macro, a fake `@stackra/ai` whose migration calls that
 *          macro): the module and macro edges (tenancy before ai although ai sorts first, also from the recorded macro
 *          call alone, and an own module after the sibling its classes depend on), no migration of a package the
 *          service has only indirectly (in node_modules through a declared package, not declared itself), the import
 *          check (`migration_import_forbidden` for a value, a type-only and a dynamic import, before the file is
 *          loaded), and the merged `Blueprint` augmentation of an own macro, through which a TypeScript program accepts
 *          the call and rejects a wrong argument, and `module_key_collision` for an own module with migrations whose
 *          key a made-up declared package's migrations need (STA-2161); the migration lock (STA-2160): the lock
 *          it returns, a locked migration changed or gone refused, a new one added after the lock passing, a locked
 *          migration a newer rule would refuse still compiling with a `migration_rule_frozen` warning, and every rule
 *          applying to an unlocked one; and the ADR 0159 classes it returns with a `migration_banned` refusal for a
 *          data write unless the lock names its migration, and an empty classification for a service with no
 *          migration (STA-2866).
 * Boundary: test only; writes under the OS temp folder and removes it. No workspace dependency is used.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 as amended by ADR 0305; ADR 0159 decision 3 (STA-2866);
 *                     STA-2160.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";
import type * as TypeScript from "typescript6";

import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import type { MemberIR } from "#core/types/member-ir.type";
import { compileMigrations } from "#node/functions/compile-migrations.function";
import { migrationSha256 } from "#node/functions/migration-sha256.function";

/** The roots written by this file. */
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

/** The migration a package ships. */
const migration = (name: string, body: string): string =>
  `export class ${name}Migration {\n  up(schema) {\n    ${body}\n  }\n}\n`;

/** The files every host has: the fake database and the two fake packages. */
const BASE: Readonly<Record<string, string>> = {
  "package.json":
    '{"name":"@acme/shop","type":"module","imports":{"#modules/*":"./src/modules/*.ts"}}',
  "node_modules/@stackra/database/package.json": JSON.stringify({
    name: "@stackra/database",
    type: "module",
    exports: { ".": { types: "./index.d.ts", default: "./index.js" } },
  }),
  "node_modules/@stackra/database/index.js": [
    "export class Macro {}",
    "export const compileMigration = (type, options) => {",
    "  const blueprint = {};",
    "  for (const M of options.macros ?? []) {",
    "    const stem = M.name.slice(0, -5);",
    "    blueprint[stem.charAt(0).toLowerCase() + stem.slice(1)] = (...args) => new M().apply(blueprint, ...args);",
    "  }",
    "  const tables = [];",
    "  const raws = [];",
    "  new type().up({",
    "    create: (table, define) => { tables.push(table); define(blueprint); },",
    "    sql: (statement) => { raws.push(statement); },",
    "  });",
    "  const steps = tables.map((table) => ({ sql: ['create table ' + table], transactional: true, inverse: false }));",
    "  if (raws.length > 0) steps.push({ sql: raws, transactional: true, inverse: false });",
    "  return { after: type.after ?? [], steps };",
    "};",
    "",
  ].join("\n"),
  "node_modules/@stackra/database/index.d.ts": [
    "export interface Blueprint {}",
    "export interface ColumnGroup { readonly columns: readonly string[] }",
    "export declare abstract class Macro { abstract apply(t: Blueprint, ...args: never[]): ColumnGroup }",
    "",
  ].join("\n"),
  "node_modules/@stackra/tenancy/package.json": JSON.stringify({
    name: "@stackra/tenancy",
    type: "module",
    exports: { "./node": "./node.js" },
  }),
  "node_modules/@stackra/tenancy/node.js": [
    'import { Macro } from "@stackra/database";',
    "export class BelongsToTenantMacro extends Macro {",
    '  apply() { return { columns: ["tenant_id"] }; }',
    "}",
    "",
  ].join("\n"),
  "node_modules/@stackra/tenancy/src/node/database/macros/belongs-to-tenant.macro.ts":
    "export {};\n",
  "node_modules/@stackra/tenancy/src/node/database/migrations/0001-create-tenants.migration.ts":
    migration("CreateTenants", 'schema.create("tenants", () => {});'),
  "node_modules/@stackra/ai/package.json": JSON.stringify({
    name: "@stackra/ai",
    type: "module",
    dependencies: { "@stackra/tenancy": "workspace:*" },
  }),
  "node_modules/@stackra/ai/src/node/database/migrations/0001-create-agents.migration.ts":
    migration("CreateAgents", 'schema.create("agents", (t) => { t.belongsToTenant(); });'),
};

/** Writes the host with `extra` files and returns its root. */
function host(extra: Readonly<Record<string, string>> = {}): string {
  const root = mkdtempSync(join(tmpdir(), "stackra-compile-migrations-"));
  roots.push(root);
  for (const [path, content] of Object.entries({ ...BASE, ...extra })) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

/** The IR of a service with `modules` that declares the two packages. */
const serviceIr = (modules: readonly string[]): MemberIR => ({
  ...LOYALTY_KIT_IR,
  member: "shop",
  package: "@acme/shop",
  layout: "service",
  modules,
  classes: [],
  packages: ["@stackra/ai", "@stackra/tenancy"],
});

/** A made-up package whose migration needs the `widgets` module through its package.json. */
const GIZMOS: Readonly<Record<string, string>> = {
  "node_modules/@stackra/gizmos/package.json": JSON.stringify({
    name: "@stackra/gizmos",
    type: "module",
    dependencies: { "@stackra/widgets": "workspace:*" },
  }),
  "node_modules/@stackra/gizmos/src/node/database/migrations/0001-create-gizmos.migration.ts":
    migration("CreateGizmos", 'schema.create("gizmos", () => {});'),
};

/** The service IR that also declares the made-up `@stackra/gizmos`. */
const gizmosIr = (modules: readonly string[]): MemberIR => ({
  ...serviceIr(modules),
  packages: ["@stackra/ai", "@stackra/gizmos", "@stackra/tenancy"],
});

describe("compileMigrations", () => {
  it("writes tenancy's migrations before ai's, which calls tenancy's macro", async () => {
    const { files, errors } = await compileMigrations(host(), serviceIr(["shop"]));
    expect(errors).toEqual([]);
    expect(files.map((file) => file.path)).toEqual([
      ".stackra/migrations/0001_tenancy_0001_create_tenants.up.sql",
      ".stackra/migrations/0002_ai_0001_create_agents.up.sql",
    ]);
  });

  it("orders by the recorded macro call alone when ai's package.json does not declare tenancy", async () => {
    const root = host({
      "node_modules/@stackra/ai/package.json": JSON.stringify({
        name: "@stackra/ai",
        type: "module",
      }),
    });
    const { files, errors } = await compileMigrations(root, serviceIr(["shop"]));
    expect(errors).toEqual([]);
    expect(files.map((file) => file.path)).toEqual([
      ".stackra/migrations/0001_tenancy_0001_create_tenants.up.sql",
      ".stackra/migrations/0002_ai_0001_create_agents.up.sql",
    ]);
  });

  it("writes no migration of a package the service has only indirectly, through a declared package", async () => {
    // tenancy is installed (ai depends on it) but the service declares only ai: tenancy's macro still compiles ai's
    // migration, while tenancy's own migration is not the service's to apply.
    const { files, errors } = await compileMigrations(host(), {
      ...serviceIr(["shop"]),
      packages: ["@stackra/ai"],
    });
    expect(errors).toEqual([]);
    expect(files.map((file) => file.path)).toEqual([
      ".stackra/migrations/0001_ai_0001_create_agents.up.sql",
    ]);
  });

  it("writes an own module after the sibling its classes depend on, although it sorts first", async () => {
    const root = host({
      "src/modules/billing/database/migrations/0001-create-invoices.migration.ts": migration(
        "CreateInvoices",
        'schema.create("invoices", () => {});',
      ),
      "src/modules/tenants/database/migrations/0001-create-accounts.migration.ts": migration(
        "CreateAccounts",
        'schema.create("accounts", () => {});',
      ),
    });
    const ir: MemberIR = {
      ...serviceIr(["billing", "tenants"]),
      classes: [
        {
          name: "InvoiceService",
          module: "billing",
          deps: [
            { class: { name: "TenantService", from: "#modules/tenants/services/tenant.service" } },
          ],
        },
        { name: "TenantService", module: "tenants", deps: [] },
      ] as unknown as MemberIR["classes"],
    };
    const { files, errors } = await compileMigrations(root, ir);
    expect(errors).toEqual([]);
    expect(files.slice(-2).map((file) => file.path)).toEqual([
      ".stackra/migrations/0003_tenants_0001_create_accounts.up.sql",
      ".stackra/migrations/0004_billing_0001_create_invoices.up.sql",
    ]);
  });

  it("puts a package migration before the member's own", async () => {
    const root = host({
      "src/modules/shop/database/migrations/0001-create-shops.migration.ts": migration(
        "CreateShops",
        'schema.create("shops", () => {});',
      ),
    });
    const { files, errors } = await compileMigrations(root, serviceIr(["shop"]));
    expect(errors).toEqual([]);
    expect(files.at(-1)?.path).toBe(".stackra/migrations/0003_shop_0001_create_shops.up.sql");
  });

  describe("an own module whose key a declared package's migrations need (STA-2161)", () => {
    it("refuses it with module_key_collision alone, naming both, and no migration_cycle", async () => {
      const root = host({
        ...GIZMOS,
        "src/modules/widgets/database/migrations/0001-create-widgets.migration.ts": migration(
          "CreateWidgets",
          'schema.create("widgets", () => {});',
        ),
      });
      const { files, errors } = await compileMigrations(root, gizmosIr(["widgets"]));
      expect(files).toEqual([]);
      expect(errors.map((error) => error.code)).toEqual(["module_key_collision"]);
      expect(errors[0]?.message).toContain(
        "`@stackra/gizmos` (hosted) needs `@stackra/widgets`'s module `widgets`",
      );
      expect(errors[0]?.message).toContain("own module `widgets` (src/modules/widgets)");
      expect(errors[0]?.fix).toMatch(/^rename the member module/);
    });

    it("compiles when the own module's key is distinct", async () => {
      const root = host({
        ...GIZMOS,
        "src/modules/gadgets/database/migrations/0001-create-gadgets.migration.ts": migration(
          "CreateGadgets",
          'schema.create("gadgets", () => {});',
        ),
      });
      const { errors } = await compileMigrations(root, gizmosIr(["gadgets"]));
      expect(errors).toEqual([]);
    });

    it("allows the shared key when the own module owns no migration (the hosting rule)", async () => {
      const root = host({ ...GIZMOS, "src/modules/widgets/widgets.module.ts": "export {};\n" });
      const { errors } = await compileMigrations(root, gizmosIr(["widgets"]));
      expect(errors.map((error) => error.code)).not.toContain("module_key_collision");
    });
  });

  it("refuses a migration importing a model, a type or a dynamic import, before loading it", async () => {
    const root = host({
      "src/modules/shop/database/migrations/0001-a.migration.ts": [
        'import { Invoice } from "#modules/billing/models/invoice.model";',
        migration("A", "Invoice;"),
      ].join("\n"),
      "src/modules/shop/database/migrations/0002-b.migration.ts": [
        'import type { X } from "../models/x.model";',
        migration("B", ""),
      ].join("\n"),
      "src/modules/shop/database/migrations/0003-c.migration.ts": migration(
        "C",
        'import("../models/y.model");',
      ),
      "src/modules/shop/database/migrations/0004-d.migration.ts": [
        'import { Migration } from "@stackra/database";',
        migration("D", "Migration;"),
      ].join("\n"),
    });
    const { files, errors } = await compileMigrations(root, serviceIr(["shop"]));
    expect(files).toEqual([]);
    expect(errors.map((error) => [error.code, error.subject])).toEqual([
      ["migration_import_forbidden", "#modules/billing/models/invoice.model"],
      ["migration_import_forbidden", "../models/x.model"],
      ["migration_import_forbidden", "../models/y.model"],
    ]);
  });

  it("refuses a package migration that imports anything else", async () => {
    const root = host({
      "node_modules/@stackra/ai/src/node/database/migrations/0002-bad.migration.ts": [
        'import { helper } from "lodash";',
        migration("Bad", "helper;"),
      ].join("\n"),
    });
    const { errors } = await compileMigrations(root, serviceIr(["shop"]));
    expect(errors.map((error) => [error.code, error.file, error.subject])).toEqual([
      [
        "migration_import_forbidden",
        "@stackra/ai/src/node/database/migrations/0002-bad.migration.ts",
        "lodash",
      ],
    ]);
  });

  it("merges an own macro into Blueprint, so its call type-checks and a wrong argument does not", async () => {
    const root = host({
      "src/modules/compliance/database/macros/retention.macro.ts": [
        'import { Macro, type Blueprint, type ColumnGroup } from "@stackra/database";',
        "export class RetentionMacro extends Macro {",
        "  apply(t: Blueprint, column: string): ColumnGroup {",
        "    return { columns: [column] };",
        "  }",
        "}",
        "",
      ].join("\n"),
      "src/modules/compliance/database/migrations/0001-create-notes.migration.ts": migration(
        "CreateNotes",
        'schema.create("notes", (t) => { t.retention("kept_until"); });',
      ),
      "probe-ok.ts":
        'import type { Blueprint } from "@stackra/database";\nexport const ok = (t: Blueprint) => t.retention("kept_until");\n',
      "probe-bad.ts":
        'import type { Blueprint } from "@stackra/database";\nexport const bad = (t: Blueprint) => t.retention(1);\n',
    });
    const { files, errors } = await compileMigrations(root, serviceIr(["compliance"]));
    expect(errors).toEqual([]);
    const blueprint = files.find((file) => file.path === ".stackra/gen/blueprint.ts");
    expect(blueprint?.content).toContain("retention: (...args: MacroArgs<RetentionMacro>)");
    mkdirSync(join(root, ".stackra/gen"), { recursive: true });
    writeFileSync(join(root, ".stackra/gen/blueprint.ts"), blueprint?.content ?? "");

    const ts = createRequire(import.meta.url)("typescript6") as typeof TypeScript;
    const errorsOf = (probe: string): number => {
      const program = ts.createProgram({
        rootNames: [join(root, probe), join(root, ".stackra/gen/blueprint.ts")],
        options: {
          noEmit: true,
          strict: true,
          skipLibCheck: true,
          types: [],
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.NodeNext,
          moduleResolution: ts.ModuleResolutionKind.NodeNext,
        },
      });
      return ts
        .getPreEmitDiagnostics(program)
        .filter((diagnostic) => diagnostic.file?.fileName.endsWith(probe) === true).length;
    };
    expect(errorsOf("probe-ok.ts")).toBe(0);
    expect(errorsOf("probe-bad.ts")).toBe(1);
  });

  it("writes no blueprint file when the service has no own macro", async () => {
    const { files } = await compileMigrations(host(), serviceIr(["shop"]));
    expect(files.some((file) => file.path.endsWith("blueprint.ts"))).toBe(false);
  });

  /** Each migration takes the highest class of its statements; runway reads the document gen writes from it. */
  it("returns the ADR 0159 class of every migration (STA-2866)", async () => {
    const root = host({
      "node_modules/@stackra/ai/src/node/database/migrations/0002-drop-note.migration.ts":
        migration("DropNote", 'schema.sql("alter table ai.agents drop column note");'),
    });
    const { safety, errors } = await compileMigrations(root, serviceIr(["shop"]));
    expect(errors).toEqual([]);
    expect(
      safety?.migrations.map((row) => [row.id, row.class, row.destructive, row.files]),
    ).toEqual([
      ["tenancy.0001_create_tenants", "additive", false, ["0001_tenancy_0001_create_tenants"]],
      ["ai.0001_create_agents", "additive", false, ["0002_ai_0001_create_agents"]],
      ["ai.0002_drop_note", "contract", true, ["0003_ai_0002_drop_note"]],
    ]);
  });

  /** "No migration" is a classification too, so runway can tell it from a checkout where gen has not run. */
  it("returns an empty classification for a service with no migration (STA-2866)", async () => {
    const { files, errors, safety } = await compileMigrations(host(), {
      ...serviceIr([]),
      packages: [],
    });
    expect([files, errors]).toEqual([[], []]);
    expect(safety).toEqual({ schema: "stackra.migration-safety/v1", migrations: [] });
  });

  /** A data write is a queue job, never a migration: refused, and no file is written. */
  it("refuses a migration that writes data with migration_banned (STA-2866)", async () => {
    const root = host({
      "node_modules/@stackra/ai/src/node/database/migrations/0002-backfill.migration.ts": migration(
        "Backfill",
        'schema.sql("update ai.agents set note = 1");',
      ),
    });
    const { files, errors } = await compileMigrations(root, serviceIr(["shop"]));
    expect(files).toEqual([]);
    expect(errors.map((error) => [error.code, error.file, error.subject])).toEqual([
      [
        "migration_banned",
        "@stackra/ai/src/node/database/migrations/0002-backfill.migration.ts",
        "ai.0002_backfill step 1 statement 1",
      ],
    ]);
  });

  /** A migration the committed lock names may already be applied: its banned statement is classified, not refused. */
  it("classifies a banned statement in a locked migration instead of refusing it (STA-2866)", async () => {
    const { lock } = await compileMigrations(host(), serviceIr(["shop"]));
    const backfill = {
      id: "ai.0002_backfill",
      sha256: migrationSha256({
        after: [],
        steps: [{ sql: ["update ai.agents set note = 1"], transactional: true, inverse: false }],
      }),
    };
    const root = host({
      "node_modules/@stackra/ai/src/node/database/migrations/0002-backfill.migration.ts": migration(
        "Backfill",
        'schema.sql("update ai.agents set note = 1");',
      ),
    });
    const { files, errors, safety } = await compileMigrations(root, serviceIr(["shop"]), {
      locked: [...(lock ?? []), backfill],
    });
    expect(errors).toEqual([]);
    expect(files.length).toBeGreaterThan(0);
    expect(safety?.migrations.at(-1)).toMatchObject({
      id: "ai.0002_backfill",
      class: "banned",
      destructive: true,
    });
  });
});

/**
 * The fake `@stackra/database` of a later version that adds an authoring rule: a table whose name starts with
 * `legacy_` is refused, or, for a frozen migration, reported in `warnings` while it compiles as before.
 */
const RULED_DATABASE = [
  "export class Macro {}",
  "export const compileMigration = (type, options) => {",
  "  const tables = [];",
  "  new type().up({ create: (table) => { tables.push(table); } });",
  "  const broken = tables.filter((table) => table.startsWith('legacy_')).map((table) => table + ': a newer rule');",
  "  if (broken.length > 0 && options.frozen !== true) throw new TypeError(broken[0]);",
  "  return {",
  "    after: type.after ?? [],",
  "    steps: tables.map((table) => ({ sql: ['create table ' + table], transactional: true, inverse: false })),",
  "    ...(options.frozen === true ? { warnings: broken } : {}),",
  "  };",
  "};",
  "",
].join("\n");

/** The member's own `shop` migration that creates `table`. */
const ownShop = (table: string): Record<string, string> => ({
  "src/modules/shop/database/migrations/0001-create-shops.migration.ts": migration(
    "CreateShops",
    `schema.create("${table}", () => {});`,
  ),
});

describe("compileMigrations under the migration lock (STA-2160)", () => {
  it("returns the lock: each migration's id and SHA-256, in apply order", async () => {
    const { lock, errors } = await compileMigrations(host(ownShop("shops")), serviceIr(["shop"]));
    expect(errors).toEqual([]);
    expect(lock?.map((entry) => entry.id)).toEqual([
      "tenancy.0001_create_tenants",
      "ai.0001_create_agents",
      "shop.0001_create_shops",
    ]);
    for (const entry of lock ?? []) expect(entry.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("passes the lock it wrote, and keeps passing it when a new migration is added after", async () => {
    const root = host(ownShop("shops"));
    const first = await compileMigrations(root, serviceIr(["shop"]));
    const again = await compileMigrations(root, serviceIr(["shop"]), { locked: first.lock ?? [] });
    expect(again.errors).toEqual([]);
    expect(again.lock).toEqual(first.lock);

    const grown = host({
      ...ownShop("shops"),
      "src/modules/shop/database/migrations/0002-create-carts.migration.ts": migration(
        "CreateCarts",
        'schema.create("carts", () => {});',
      ),
    });
    const next = await compileMigrations(grown, serviceIr(["shop"]), { locked: first.lock ?? [] });
    expect(next.errors).toEqual([]);
    expect(next.lock?.slice(0, 3)).toEqual(first.lock);
    expect(next.lock?.at(-1)?.id).toBe("shop.0002_create_carts");
  });

  it("refuses a locked migration whose source changed, and writes nothing", async () => {
    const { lock } = await compileMigrations(host(ownShop("shops")), serviceIr(["shop"]));
    const edited = await compileMigrations(host(ownShop("stores")), serviceIr(["shop"]), {
      locked: lock ?? [],
    });
    expect(edited.files).toEqual([]);
    expect(edited.lock).toBeUndefined();
    expect(edited.errors.map((error) => [error.code, error.subject])).toEqual([
      ["migration_locked_changed", "shop.0001_create_shops"],
    ]);
  });

  it("refuses a locked migration that is gone", async () => {
    const { lock } = await compileMigrations(host(ownShop("shops")), serviceIr(["shop"]));
    const gone = await compileMigrations(host(), serviceIr(["shop"]), { locked: lock ?? [] });
    expect(gone.files).toEqual([]);
    expect(gone.errors.map((error) => [error.code, error.subject])).toEqual([
      ["migration_locked_missing", "shop.0001_create_shops"],
    ]);
  });

  it("refuses a lock whose migrations are all gone", async () => {
    const root = mkdtempSync(join(tmpdir(), "stackra-compile-migrations-"));
    roots.push(root);
    writeFileSync(join(root, "package.json"), '{"name":"@acme/shop","type":"module"}');
    const { errors, files } = await compileMigrations(
      root,
      { ...serviceIr(["shop"]), packages: [] },
      { locked: [{ id: "shop.0001_create_shops", sha256: "1".repeat(64) }] },
    );
    expect(files).toEqual([]);
    expect(errors.map((error) => error.code)).toEqual(["migration_locked_missing"]);
  });

  it("still compiles a locked migration a newer rule would refuse, with a warning and the same lock", async () => {
    // Locked under a database version without the rule.
    const { lock, files } = await compileMigrations(
      host(ownShop("legacy_shops")),
      serviceIr(["shop"]),
    );
    const root = host({
      ...ownShop("legacy_shops"),
      "node_modules/@stackra/database/index.js": RULED_DATABASE,
    });
    const frozen = await compileMigrations(root, serviceIr(["shop"]), { locked: lock ?? [] });
    expect(frozen.errors).toEqual([]);
    expect(frozen.lock).toEqual(lock);
    expect(frozen.files.map((file) => file.content)).toEqual(files.map((file) => file.content));
    expect(frozen.warnings).toEqual([
      expect.objectContaining({
        code: "migration_rule_frozen",
        severity: "warning",
        subject: "shop.0001_create_shops",
      }),
    ]);
    expect(frozen.warnings?.[0]?.message).toContain("legacy_shops: a newer rule");
  });

  it("applies every rule to a migration the lock does not name", async () => {
    const root = host({
      ...ownShop("legacy_shops"),
      "node_modules/@stackra/database/index.js": RULED_DATABASE,
    });
    const { lock } = await compileMigrations(host(), serviceIr(["shop"]));
    const unlocked = await compileMigrations(root, serviceIr(["shop"]), { locked: lock ?? [] });
    expect(unlocked.files).toEqual([]);
    expect(unlocked.warnings).toEqual([]);
    expect(unlocked.errors.map((error) => [error.code, error.subject])).toEqual([
      ["migration_compile_failed", "shop.0001_create_shops"],
    ]);
    expect(unlocked.errors[0]?.message).toContain("legacy_shops: a newer rule");
  });
});
