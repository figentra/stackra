/**
 * Stackra file contract:
 * Purpose: `SystemFunctionOptions`, the lookup or claim function `schema.systemFunction` writes in the module's schema:
 *          its name, arguments, returned columns, body and reason.
 * Boundary: a type only. Names are snake_case literals; types are SQL type names (`varchar(33)`, `integer`,
 *           `timestamptz`). The body is the package's own SQL and names every table with its schema, since the
 *           function's `search_path` is `pg_catalog, pg_temp`.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, gap A).
 */

/** The options of `SchemaBuilder.systemFunction`. */
export interface SystemFunctionOptions {
  /** The function's name in the module's schema. */
  readonly name: string;

  /** Each argument's name and SQL type, in call order. */
  readonly args: Readonly<Record<string, string>>;

  /** Each returned column's name and SQL type: ids and the tenant id, never a payload. */
  readonly returns: Readonly<Record<string, string>>;

  /** The `language sql` body: schema-qualified, no blank line. */
  readonly sql: string;

  /** Why a system worker or route needs it before a tenant is known; required, one line. */
  readonly reason: string;
}
