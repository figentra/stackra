/**
 * Stackra file contract:
 * Purpose: unit tests of `readMigrationTables`: one entry per `schema.create`/`schema.table` block of a service's
 *          migrations per module in file order, `tenant` set only for the block that calls `t.belongsToTenant(...)`
 *          (either form) or writes the `tenant_id` policy itself; a package's under `src/node` with the member as module.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159; ADR 0239 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { readMigrationTables } from "#node/functions/read-migration-tables.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("readMigrationTables", () => {
  it("reads a service's blocks per module and file, with the tenant call of each", () => {
    const root = writeFixtureMember("shop", {
      "src/modules/orders/database/migrations/0001-create-orders.migration.ts": [
        'schema.create("orders", (t: Blueprint) => {',
        "  t.belongsToTenant();",
        "});",
        'schema.create("order_notes", (t: Blueprint) => {',
        '  t.string("body");',
        "});",
      ].join("\n"),
      "src/modules/orders/database/migrations/0002-own-notes.migration.ts": [
        'schema.table("order_notes", (t: Blueprint) => t.belongsToTenant({ nullable: true }));',
      ].join("\n"),
    });
    const first = "src/modules/orders/database/migrations/0001-create-orders.migration.ts";
    expect(readMigrationTables(root, "service", "shop")).toEqual([
      { file: first, module: "orders", table: "orders", ownerColumn: true, columns: [] },
      {
        file: first,
        module: "orders",
        table: "order_notes",
        ownerColumn: false,
        columns: [{ name: "body", method: "string" }],
      },
      {
        file: "src/modules/orders/database/migrations/0002-own-notes.migration.ts",
        module: "orders",
        table: "order_notes",
        ownerColumn: true,
        columns: [],
      },
    ]);
  });

  it("carries the tenant column through a raw table rename, never reading its inverse", () => {
    const root = writeFixtureMember("ai", {
      "src/node/database/migrations/0001-create-steps.migration.ts":
        'schema.create("steps", (t: Blueprint) => { t.belongsToTenant(); });\nschema.create("notes", (t: Blueprint) => {});',
      "src/node/database/migrations/0002-rename.migration.ts": [
        'schema.sql(\'alter table "ai"."steps" rename to "run_steps"\', {',
        '  inverse: \'alter table "ai"."run_steps" rename to "steps"\',',
        "});",
        'schema.sql(\'alter table "ai"."notes" rename to "run_notes"\');',
      ].join("\n"),
    });
    expect(
      readMigrationTables(root, "package", "ai").map((block) => [block.table, block.ownerColumn]),
    ).toEqual([
      ["steps", true],
      ["notes", false],
      ["run_steps", true],
      ["run_notes", false],
    ]);
  });

  it("counts a block that writes the tenant_id policy itself, and no other column's policy", () => {
    const root = writeFixtureMember("relay", {
      "src/node/database/migrations/0002-contract-relay-tenancy.migration.ts": [
        'schema.table("messages", (t: Blueprint) => {',
        '  t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "platform" });',
        "});",
        'schema.table("routes", (t: Blueprint) => {',
        '  t.rowLevelSecurity("scope_id", { setting: "app.tenant_id", match: "equals" });',
        "});",
      ].join("\n"),
    });
    const file = "src/node/database/migrations/0002-contract-relay-tenancy.migration.ts";
    expect(readMigrationTables(root, "package", "relay")).toEqual([
      { file, module: "relay", table: "messages", ownerColumn: true, columns: [] },
      { file, module: "relay", table: "routes", ownerColumn: false, columns: [] },
    ]);
  });

  it("reads a package's migrations with the member as module", () => {
    const root = writeFixtureMember("loyalty-kit", {
      "src/node/database/migrations/0001-create-loyalty-tables.migration.ts":
        'schema.create("loyalty_accounts", (t: Blueprint) => { t.string("tier"); });',
    });
    expect(readMigrationTables(root, "package", "loyalty_kit")).toEqual([
      {
        file: "src/node/database/migrations/0001-create-loyalty-tables.migration.ts",
        module: "loyalty_kit",
        table: "loyalty_accounts",
        ownerColumn: false,
        columns: [{ name: "tier", method: "string" }],
      },
    ]);
  });

  it("reads each column a block adds with its Blueprint method, and nothing else", () => {
    const root = writeFixtureMember("venues", {
      "src/node/database/migrations/0001-create-closures.migration.ts": [
        'schema.create("closures", (t: Blueprint) => {',
        '  t.hasPublicId("clo");',
        '  t.string("closed_on", 10).notNull().comment("The closed day.");',
        '  t.jsonb("hours").nullable().comment("Opening hours");',
        '  t.link("venue_id").notNull().comment("Its venue.");',
        '  t.index(["venue_id"]);',
        "});",
      ].join("\n"),
    });
    expect(readMigrationTables(root, "package", "venues")[0]?.columns).toEqual([
      { name: "closed_on", method: "string" },
      { name: "hours", method: "jsonb" },
      { name: "venue_id", method: "link" },
    ]);
  });
});
