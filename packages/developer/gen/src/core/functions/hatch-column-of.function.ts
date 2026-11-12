/**
 * Stackra file contract:
 * Purpose: `hatchColumnOf`, the migration column of a `@Field(zod)` hatch field: its table, column name, the Blueprint
 *          method that adds it and the migration file. `emitEntities` takes the field's ORM type from it and
 *          `checkHatchColumns` refuses and reports from it.
 * Boundary: pure; reads the IR only. A field is matched to its column by name (`snakeCase(field)`) in the latest block
 *           of the model's table that adds the column (a later migration that re-adds it wins). Undefined when no
 *           migration adds the column through a Blueprint method (a raw `schema.sql`, a macro, a member with no
 *           migrations): the field then keeps the ORM's JSON type. A model addition's side table is matched the same way.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (the migration owns the column type); ADR 0095 as amended by ADR 0294.
 */
import { snakeCase } from "@stackra/support";

import { tableName } from "#core/functions/table-name.function";
import type { FieldIR } from "#core/types/field-ir.type";
import type { HatchColumn } from "#core/types/hatch-column.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

/**
 * The column of `field` of `shape`, or undefined when no migration block adds it.
 *
 * @param ir - the member read by discovery.
 * @param shape - the model or model addition that declares `field`.
 * @param field - the hatch field.
 * @example
 * hatchColumnOf(ir, closure, closedOn); // { table: "venues.closures", column: "closed_on", method: "string", file: "…" }
 */
export function hatchColumnOf(
  ir: MemberIR,
  shape: ShapeIR,
  field: FieldIR,
): HatchColumn | undefined {
  const blocks = ir.migrationTables ?? [];
  if (blocks.length === 0) return undefined;
  const table = tableName(shape.module, shape.name);
  const bare = table.slice(table.indexOf(".") + 1);
  const column = snakeCase(field.name);
  const added = blocks
    .filter((block) => block.module === shape.module && block.table === bare)
    .flatMap((block) =>
      (block.columns ?? [])
        .filter((each) => each.name === column)
        .map((each) => ({ file: block.file, method: each.method })),
    )
    .at(-1);
  return added === undefined ? undefined : { table, column, ...added };
}
