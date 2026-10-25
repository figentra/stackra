/**
 * Stackra file contract:
 * Purpose: `StackraNamingStrategy`, the MikroORM naming strategy every Stackra ORM uses: snake_case columns, and the
 *          ADR 0231 names for indexes and unique indexes (`idx_`), foreign keys (`fk_`) and check constraints (`ck_`).
 * Boundary: table names are not derived here: gen writes `tableName` and `schema` into every entity, because the
 *           plural and the module schema are gen's and locked in the manifest. The names come from the same function
 *           the migration compiler uses, so the ORM and the migrations agree.
 * Runtime: node
 * Governing contract: ADR 0231 as amended by ADR 0294; ADR 0097 (decision 3: gen emits EntitySchema); the STA-335
 *                     entity-schema spike.
 */
import { UnderscoreNamingStrategy } from "@mikro-orm/core";

import { constraintName } from "#core/functions/constraint-name.function";

/** The kinds of name MikroORM asks for. */
type NameKind = Parameters<UnderscoreNamingStrategy["indexName"]>[2];

/**
 * Underscore naming with the `idx_`, `fk_` and `ck_` prefixes.
 *
 * @example
 * await MikroORM.init({ entities, namingStrategy: StackraNamingStrategy });
 */
export class StackraNamingStrategy extends UnderscoreNamingStrategy {
  /** The name of an index, a foreign key or a check on `tableName` (schema-qualified or not) over `columns`. */
  override indexName(tableName: string, columns: string[], type: NameKind): string {
    const table = tableName.slice(tableName.lastIndexOf(".") + 1);
    const names = columns.map((column) => column.replaceAll(".", "_"));
    if (type === "foreign") return constraintName("fk", table, names);
    if (type === "index" || type === "unique") return constraintName("idx", table, names);
    if (type === "check") return constraintName("ck", table, names);
    return super.indexName(tableName, columns, type);
  }
}
