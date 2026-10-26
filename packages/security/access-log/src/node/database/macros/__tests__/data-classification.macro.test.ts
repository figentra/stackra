/**
 * Stackra file contract:
 * Purpose: unit tests of `DataClassificationMacro`: installed as `t.dataClassification`, it writes a text column checked
 *          by `ck_<table>_<column>` against every code, which are exactly the `DataClassification` codes, and leaves
 *          its nullability and comment to the caller.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 as amended by ADR 0305; ADR 0134; ADR 0231.
 */
import { DataClassification, Enum } from "@stackra/contracts";
import { compileMigration, Macro, Migration } from "@stackra/database";
import type { Blueprint, SchemaBuilder } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { DataClassificationMacro } from "#node/database/macros/data-classification.macro";

/** The SQL of a migration that creates `data_exports` with one classification column, `stated` or bare. */
function compiled(stated: boolean): string {
  class DataExportsMigration extends Migration {
    up(schema: SchemaBuilder): void {
      schema.create("data_exports", (t: Blueprint) => {
        t.hasPublicId("dex");
        const column = t.dataClassification("classification");
        if (stated) column.notNull().comment("The classification of the exported data.");
      });
    }
  }
  return compileMigration(DataExportsMigration, {
    schema: "privacy",
    macros: [DataClassificationMacro],
  })
    .steps.flatMap((step) => step.sql)
    .join("\n");
}

describe("DataClassificationMacro", () => {
  it("is a macro", () => {
    expect(new DataClassificationMacro()).toBeInstanceOf(Macro);
  });

  it("writes a text column checked against every classification code, regulated included", () => {
    const sql = compiled(true);
    const codes = Enum.values(DataClassification)
      .map((code) => `'${code}'`)
      .join(", ");
    expect(codes).toContain("'regulated'");
    expect(sql).toContain(
      `"classification" text not null constraint "ck_data_exports_classification" check ("classification" in (${codes}))`,
    );
  });

  it("leaves the nullability and the comment to the caller", () => {
    expect(() => compiled(false)).toThrow(TypeError);
  });
});
