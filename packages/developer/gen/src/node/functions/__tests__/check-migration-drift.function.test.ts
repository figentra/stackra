/**
 * Stackra file contract:
 * Purpose: unit tests of `checkMigrationDrift` under the committed migration lock (STA-2160): `stackra db diff` refuses
 *          a malformed lock and a locked migration edited since, as `stackra gen` does, before it replays anything.
 * Boundary: test only; writes a fixture service under `.cache/` with a fake `@stackra/database` (no replay database is
 *           reached: both refusals come before the replay).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 3: `stackra db diff`); ADR 0159 (2026-10-23 note:
 *                     the SHA-256 lock); STA-2160.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { checkMigrationDrift } from "#node/functions/check-migration-drift.function";
import { generate } from "#node/functions/generate.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

/** The migration file of the fixture service. */
const MIGRATION = "src/modules/shop/database/migrations/0001-create-shops.migration.ts";

/** The migration that creates `table`. */
const migration = (table: string): string =>
  [
    'import { Migration } from "@stackra/database";',
    "",
    "export class CreateShopsMigration extends Migration {",
    "  up(schema: { create(table: string): void }): void {",
    `    schema.create("${table}");`,
    "  }",
    "}",
    "",
  ].join("\n");

/** A v2 service (authored src/main.ts) with one migration and a fake `@stackra/database`, generated once. */
async function lockedService(): Promise<string> {
  const root = writeFixtureMember("example", {
    "stackra.config.ts":
      'import { defineService } from "@stackra/contracts";\n\nexport default defineService({});\n',
    "src/example.module.ts":
      'import { Module } from "@stackra/container";\n\nexport class ExampleModule extends Module({ imports: [] }) {}\n',
    "src/main.ts": 'process.stdout.write("hello\\n");\n',
    "tsdown.config.ts": 'export default { entry: ["src/main.ts"] };\n',
    "node_modules/@stackra/database/package.json": JSON.stringify({
      name: "@stackra/database",
      type: "module",
      exports: { ".": { types: "./index.d.ts", default: "./index.js" } },
    }),
    "node_modules/@stackra/database/index.d.ts":
      "export declare abstract class Migration { abstract up(schema: { create(table: string): void }): void }\n",
    "node_modules/@stackra/database/index.js": [
      "export class Migration {}",
      "export const compileMigration = (type) => {",
      "  const tables = [];",
      "  new type().up({ create: (table) => { tables.push(table); } });",
      "  return { after: [], steps: tables.map((table) => ({ sql: ['create table ' + table], transactional: true, inverse: false })) };",
      "};",
      "",
    ].join("\n"),
    [MIGRATION]: migration("shops"),
  });
  const path = join(root, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  pkg["dependencies"] = {
    "@stackra/container": "workspace:*",
    "@stackra/tsdown-config": "workspace:*",
    "encore.dev": "catalog:",
  };
  writeFileSync(path, JSON.stringify(pkg));
  expect((await generate(root)).errors).toEqual([]);
  return root;
}

describe("checkMigrationDrift under the migration lock (STA-2160)", () => {
  it("refuses a locked migration edited since, before replaying it", async () => {
    const root = await lockedService();
    writeFileSync(join(root, MIGRATION), migration("stores"));
    const drift = await checkMigrationDrift(root);
    expect(drift.compared).toBe(false);
    expect(drift.errors.map((error) => [error.code, error.subject])).toEqual([
      ["migration_locked_changed", "shop.0001_create_shops"],
    ]);
  });

  it("refuses a malformed lock", async () => {
    const root = await lockedService();
    const path = join(root, "stackra.manifest.json");
    const manifest = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    writeFileSync(path, JSON.stringify({ ...manifest, migrations: "all of them" }));
    const drift = await checkMigrationDrift(root);
    expect(drift.compared).toBe(false);
    expect(drift.errors.map((error) => error.code)).toEqual(["migration_lock_malformed"]);
  });
});
