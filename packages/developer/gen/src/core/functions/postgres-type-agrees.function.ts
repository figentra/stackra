/**
 * Stackra file contract:
 * Purpose: `postgresTypeAgrees`, whether a migrated column type satisfies the type the model's field maps to: `text`
 *          agrees with `text`, `citext` and any `varchar(n)`; `integer` with `smallint`, `integer` and `bigint`;
 *          `numeric` with any `numeric(p, s)`, `real` and `double precision`; any other type only with itself.
 * Boundary: pure. The families exist because a model field says "text" or "whole number" and the migration chooses the
 *           length or width; the comparison is for a different type, not a different size.
 *           shortcut: `varchar(33)` is exact, so a public id column of another length is reported; tighten the
 *           families if a migration legitimately differs.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (the migration owns lengths); ADR 0135; STA-1808.
 */
import { normalizePostgresType } from "#core/functions/normalize-postgres-type.function";

/** The migrated types a family accepts. */
const FAMILIES: Readonly<Record<string, RegExp>> = {
  text: /^(text|citext|varchar(\(\d+\))?)$/,
  integer: /^(smallint|integer|bigint)$/,
  numeric: /^(numeric(\(.*\))?|real|double precision)$/,
};

/**
 * Whether `actual` (a migrated column's type) satisfies `expected` (the map's type).
 *
 * @example
 * postgresTypeAgrees("text", "character varying(120)"); // true
 * postgresTypeAgrees("varchar(33)", "text"); // false
 */
export function postgresTypeAgrees(expected: string, actual: string): boolean {
  const type = normalizePostgresType(actual);
  const family = FAMILIES[expected];
  return family === undefined ? type === expected : family.test(type);
}
