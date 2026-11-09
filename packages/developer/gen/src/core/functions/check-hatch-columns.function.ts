/**
 * Stackra file contract:
 * Purpose: `checkHatchColumns`, the gen check `hatch_column_not_jsonb`: a model field typed through the `@Field(zod)`
 *          hatch is stored by the ORM as JSON (`"2026-11-01"` with its quotes), so its column must be `jsonb`. A
 *          migration that adds it with another Blueprint method (`t.string("closed_on", 10)`) is refused, naming the
 *          model, the field and the migration, because every write would fail in Postgres (GEO: a varchar(10) column).
 * Boundary: pure; reads the IR only. A field is matched to its column by name (`snakeCase(field)`) in the latest block
 *           of the model's table that adds the column (a later migration that re-adds it wins). A column no migration
 *           adds through a Blueprint method (a raw `schema.sql`, a macro) is not judged: `stackra db diff` compares the
 *           live schema. A model addition's side table is matched the same way.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (the migration owns the column type); ADR 0095 as amended by ADR 0294 (the `@Field(zod)`
 *                     hatch); ADR 0014 (the ORM's JSON type).
 */
import { snakeCase } from "@stackra/support";

import { tableName } from "#core/functions/table-name.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The Blueprint method of a `jsonb` column. */
const JSONB = "jsonb";

/**
 * The `hatch_column_not_jsonb` refusals of `ir`: one per hatch field whose column is added with another method.
 *
 * @param ir - the member read by discovery.
 * @example
 * checkHatchColumns(serviceIr).map((error) => error.code); // ["hatch_column_not_jsonb"]
 */
export function checkHatchColumns(ir: MemberIR): GenError[] {
  const blocks = ir.migrationTables ?? [];
  if (blocks.length === 0) return [];
  const errors: GenError[] = [];
  for (const shape of ir.shapes) {
    if (shape.kind !== "model" && shape.kind !== "model_addition") continue;
    const table = tableName(shape.module, shape.name);
    const bare = table.slice(table.indexOf(".") + 1);
    for (const field of shape.fields) {
      if (field.type.kind !== "hatch") continue;
      const column = snakeCase(field.name);
      const added = blocks
        .filter((block) => block.module === shape.module && block.table === bare)
        .flatMap((block) =>
          (block.columns ?? [])
            .filter((each) => each.name === column)
            .map((each) => ({ file: block.file, method: each.method })),
        )
        .at(-1);
      if (added === undefined || added.method === JSONB) continue;
      errors.push({
        code: "hatch_column_not_jsonb",
        file: shape.file,
        line: 0,
        column: 0,
        subject: `${shape.name}.${field.name}`,
        message: `${shape.name}.${field.name} is a @Field(zod) hatch, which the ORM stores as JSON, but ${added.file} adds ${table}.${column} with t.${added.method}(), so every write of it fails in Postgres`,
        fix: `add the column with t.jsonb(${JSON.stringify(column)}) (a migration that changes ${column} to jsonb), or type ${shape.name}.${field.name} with a decorator gen maps to a column type (@Str, a branded string) instead of @Field(zod)`,
      });
    }
  }
  return errors;
}
