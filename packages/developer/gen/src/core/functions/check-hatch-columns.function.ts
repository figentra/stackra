/**
 * Stackra file contract:
 * Purpose: `checkHatchColumns`, the gen check of a model field typed through the `@Field(zod)` hatch. The entity takes
 *          the field's ORM type from its migration column (`HATCH_ORM_TYPES`), so a `t.string`, `t.enum` or `t.integer`
 *          column is read and written bare, not JSON-encoded (GEO: a varchar(10) column refused every `"2026-11-01"`
 *          the ORM wrote with its quotes). One info finding `hatch_column_type` names each field whose type is taken
 *          from its column rather than JSON; `hatch_column_unmapped` refuses a field whose column is added with a
 *          method that has no ORM type (`tsvector`, `point`, `polygon`, `line`), naming the model, the field and
 *          the migration.
 * Boundary: pure; reads the IR only, through `hatchColumnOf` (the latest block that adds the column decides). A column
 *           no migration adds through a Blueprint method is not judged: `stackra db diff` compares the live schema. The
 *           info finding carries `severity: "info"`, prints, and never blocks or counts as a warning.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (the migration owns the column type); ADR 0095 as amended by ADR 0294 (the `@Field(zod)`
 *                     hatch); ADR 0014 (the ORM's JSON type).
 */
import { HATCH_ORM_TYPES } from "#core/constants/hatch-orm-types.constant";
import { hatchColumnOf } from "#core/functions/hatch-column-of.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The `hatch_column_unmapped` refusals and `hatch_column_type` info lines of `ir`.
 *
 * @param ir - the member read by discovery.
 * @example
 * checkHatchColumns(serviceIr).map((error) => error.code); // ["hatch_column_type"]
 */
export function checkHatchColumns(ir: MemberIR): GenError[] {
  const errors: GenError[] = [];
  for (const shape of ir.shapes) {
    if (shape.kind !== "model" && shape.kind !== "model_addition") continue;
    for (const field of shape.fields) {
      if (field.type.kind !== "hatch") continue;
      const found = hatchColumnOf(ir, shape, field);
      if (found === undefined) continue;
      const orm = HATCH_ORM_TYPES[found.method];
      const subject = `${shape.name}.${field.name}`;
      if (orm === undefined) {
        errors.push({
          code: "hatch_column_unmapped",
          file: shape.file,
          line: 0,
          column: 0,
          subject,
          message: `${subject} is a @Field(zod) hatch, but ${found.file} adds ${found.table}.${found.column} with t.${found.method}(), which has no ORM type a hatch value fits, so every write of it fails in Postgres`,
          fix: `add the column with t.jsonb(${JSON.stringify(found.column)}), t.string, t.enum, t.integer, t.boolean or t.timestamp, or type ${subject} with a decorator gen maps to a column type instead of @Field(zod)`,
        });
        continue;
      }
      if (orm === "json") continue;
      errors.push({
        code: "hatch_column_type",
        file: shape.file,
        line: 0,
        column: 0,
        subject,
        severity: "info",
        message: `stored as ${orm}, from t.${found.method}() in ${found.file}`,
        fix: `none needed; add the column with t.jsonb(${JSON.stringify(found.column)}) to store ${subject} as JSON instead`,
      });
    }
  }
  return errors;
}
