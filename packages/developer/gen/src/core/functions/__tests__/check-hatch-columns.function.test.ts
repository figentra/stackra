/**
 * Stackra file contract:
 * Purpose: unit tests of `checkHatchColumns`: a `@Field(zod)` hatch field whose migration column is a mapped method
 *          (GEO's `t.string("closed_on", 10)`) is reported by an info `hatch_column_type` and passes; a column with no
 *          ORM mapping (`tsvector`) is refused `hatch_column_unmapped`, naming the model, the field and the migration;
 *          a `jsonb` column is silent; the latest block that adds the column decides; a typed field, a column no block
 *          adds and a member with no migrations are not judged.
 * Boundary: test only; a hand-built IR of one model.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159; ADR 0095 as amended by ADR 0294.
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { checkHatchColumns } from "#core/functions/check-hatch-columns.function";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

/** A field named `name` of type `type`. */
const field = (name: string, type: FieldIR["type"]): FieldIR => ({
  name,
  optional: false,
  nullable: false,
  type,
  rules: [],
});

/** The `Closure` model of the `venues` module, with a hatch field and a typed one. */
const CLOSURE: ShapeIR = {
  name: "Closure",
  kind: "model",
  module: "venues",
  file: "src/modules/venues/models/closure.model.ts",
  importPath: "#modules/venues/models/closure.model",
  fields: [
    field("closedOn", { kind: "hatch", source: "IsoDate$" }),
    field("reason", { kind: "string" } as FieldIR["type"]),
  ],
  relations: [],
};

/** A migration block of `venues.closures` adding `columns`. */
const block = (file: string, columns: readonly { name: string; method: string }[]) => ({
  file,
  module: "venues",
  table: "closures",
  ownerColumn: false,
  columns,
});

/** The fixture with the Closure model and `blocks`. */
const memberWith = (blocks: NonNullable<MemberIR["migrationTables"]>): MemberIR => ({
  ...COMMERCE_IR,
  shapes: [CLOSURE],
  migrationTables: blocks,
});

describe("checkHatchColumns", () => {
  it("reports a hatch field whose column maps to an ORM type as info, never a refusal", () => {
    const errors = checkHatchColumns(
      memberWith([
        block("0001-create-closures.migration.ts", [
          { name: "closed_on", method: "string" },
          { name: "reason", method: "string" },
        ]),
      ]),
    );
    expect(errors.map((error) => [error.code, error.subject, error.severity])).toEqual([
      ["hatch_column_type", "Closure.closedOn", "info"],
    ]);
    expect(errors[0]?.message).toBe(
      "stored as string, from t.string() in 0001-create-closures.migration.ts",
    );
  });

  it("refuses a hatch field whose column has no ORM mapping, naming the model, field and migration", () => {
    const errors = checkHatchColumns(
      memberWith([
        block("0001-create-closures.migration.ts", [{ name: "closed_on", method: "tsvector" }]),
      ]),
    );
    expect(errors.map((error) => [error.code, error.subject, error.severity])).toEqual([
      ["hatch_column_unmapped", "Closure.closedOn", undefined],
    ]);
    expect(errors[0]?.message).toContain("0001-create-closures.migration.ts");
    expect(errors[0]?.message).toContain("venues.closures.closed_on");
  });

  it("is silent for a jsonb column, and lets the latest block that adds the column decide", () => {
    expect(
      checkHatchColumns(
        memberWith([
          block("0001-create-closures.migration.ts", [{ name: "closed_on", method: "jsonb" }]),
        ]),
      ),
    ).toEqual([]);
    expect(
      checkHatchColumns(
        memberWith([
          block("0001-create-closures.migration.ts", [{ name: "closed_on", method: "tsvector" }]),
          block("0002-closed-on-jsonb.migration.ts", [{ name: "closed_on", method: "jsonb" }]),
        ]),
      ),
    ).toEqual([]);
  });

  it("does not judge a column no block adds, or a member with no migrations", () => {
    expect(checkHatchColumns(memberWith([block("0001-create-closures.migration.ts", [])]))).toEqual(
      [],
    );
    expect(checkHatchColumns({ ...COMMERCE_IR, shapes: [CLOSURE] })).toEqual([]);
  });
});
