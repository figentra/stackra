/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Migration`: both forms register the `migration` kind, the called form records and
 *          checks `after`, and `up(schema)` is the one member a migration states.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 as amended by ADR 0294 and ADR 0305; ADR 0022; ADR 0269.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Migration } from "#core/bases/migration.base";
import type { MigrationId } from "#core/types/migration-id.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";

const textFunctions = "search.0001_create_text_functions" as MigrationId;

describe("Migration", () => {
  it("registers the bare form with no after", () => {
    class AddPaidAtMigration extends Migration {
      up(): void {}
    }
    expect(kindOf(AddPaidAtMigration)?.kind).toBe("migration");
    expect(new AddPaidAtMigration()).toBeInstanceOf(Migration);
  });

  it("records after on the called form", () => {
    class SearchIndexMigration extends Migration({ after: [textFunctions] }) {
      up(): void {}
    }
    expect(kindOf(SearchIndexMigration)?.options).toEqual({ after: [textFunctions] });
  });

  it("refuses an after that is not a list of migration ids", () => {
    expect(() => Migration({ after: ["create_text_functions" as MigrationId] })).toThrow(TypeError);
    expect(() => Migration({ after: "x" as unknown as MigrationId[] })).toThrow(TypeError);
  });

  it("types up(schema) as the one member", () => {
    expectTypeOf<InstanceType<typeof Migration>["up"]>().parameters.toEqualTypeOf<
      [SchemaBuilder]
    >();
  });
});
