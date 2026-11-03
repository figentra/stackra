/**
 * Stackra file contract:
 * Purpose: unit tests of `compileMigrations` against a hermetic host in a temp folder (a fake `@stackra/database`, a
 *          fake `@stackra/tenancy` shipping a migration and a macro, a fake `@stackra/ai` whose migration calls that
 *          macro): the module and macro edges (tenancy before ai although ai sorts first, also from the recorded macro
 *          call alone, and an own module after the sibling its classes depend on), the import check
 *          (`migration_import_forbidden` for a value, a type-only and a dynamic import, before the file is loaded), and
 *          the merged `Blueprint` augmentation of an own macro, through which a TypeScript program accepts the call
 *          and rejects a wrong argument.
 * Boundary: test only; writes under the OS temp folder and removes it. No workspace dependency is used.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 as amended by ADR 0305.
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
    "  new type().up({ create: (table, define) => { tables.push(table); define(blueprint); } });",
    "  return {",
    "    after: type.after ?? [],",
    "    steps: tables.map((table) => ({ sql: ['create table ' + table], transactional: true, inverse: false })),",
    "  };",
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
});
