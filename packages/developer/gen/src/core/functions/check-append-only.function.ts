/**
 * Stackra file contract:
 * Purpose: `checkAppendOnly(ir, units)`, the gen check that every own `AppendOnly` model's table has its `UPDATE`
 *          revoked by a compiled migration (`t.appendOnly()`), refusing `append_only_not_revoked` otherwise: the trait's
 *          contract says the database refuses an update, and only the revoke makes a native or raw write obey it.
 * Boundary: pure, over the IR and the compiled units of the member and its declared packages. Only the member's own
 *           models are checked; a package's models are its own gen's. A model whose module has no migration at all has
 *           no table yet and is not refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (data invariants); ADR 0220 (the ledger is append-only); ADR 0159 (generated
 *                     migrations); data-layer gap db5 (stackra-256).
 */
import { tableName } from "#core/functions/table-name.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { MigrationUnit } from "#core/types/migration-unit.type";

/**
 * The refusals of the append-only check.
 *
 * @example
 * checkAppendOnly(ir, units).map((error) => error.code); // ["append_only_not_revoked"]
 */
export function checkAppendOnly(ir: MemberIR, units: readonly MigrationUnit[]): GenError[] {
  const sql = units.flatMap((unit) => unit.steps.flatMap((step) => step.sql));
  const modules = new Set(units.map((unit) => unit.id.slice(0, unit.id.indexOf("."))));
  return ir.classes
    .filter(
      (declared) =>
        declared.kind === "model" &&
        modules.has(declared.module) &&
        declared.traits.some((trait) => trait.name === "AppendOnly"),
    )
    .flatMap((declared) => {
      const table = tableName(declared.module, declared.name);
      const [schema, name] = table.split(".");
      const revoke = `revoke update on "${schema}"."${name}"`;
      return sql.some((statement) => statement.startsWith(revoke))
        ? []
        : [
            {
              code: "append_only_not_revoked",
              file: declared.file,
              line: 0,
              column: 0,
              subject: declared.name,
              message: `${declared.name} is AppendOnly, but no migration revokes UPDATE on ${table}, so a native or raw write could still change its rows`,
              fix: `call \`t.appendOnly()\` in a new migration on ${table} (\`schema.table("${name}", (t) => t.appendOnly())\`)`,
            },
          ];
    });
}
