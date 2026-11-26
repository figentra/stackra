/**
 * Stackra file contract:
 * Purpose: `seedValue`, the SQL expression of a fresh value for a primary-key column `assertRowSecurity` must fill to
 *          seed a probe row: a random string, number, UUID or instant cast to the column's type.
 * Boundary: pure. Only key columns need one (the audit drops every other NOT NULL and check inside its rolled-back
 *           transaction); a type outside these four gets none, and the audit reports the table as not seeded.
 * Runtime: isomorphic
 * Governing contract: ADR 0347 (decision 5); `.agents/rules/tenancy.md` (point 7).
 */
import type { SeedColumn } from "#testing/types/seed-column.type";

/**
 * The value expression, or undefined when the type has no generic value.
 *
 * @example
 * seedValue({ type: "character varying(33)", category: "S", typeName: "varchar" }); // "md5(random()::text)::character varying(33)"
 */
export function seedValue({ type, category, typeName }: SeedColumn): string | undefined {
  if (typeName === "uuid") return "gen_random_uuid()";
  // An explicit cast to varchar(n) or char(n) truncates, so the 32 characters fit any length.
  if (category === "S") return `md5(random()::text)::${type}`;
  if (category === "N") return `floor(random() * 1000000)::${type}`;
  if (category === "D") return `clock_timestamp()::${type}`;
  return undefined;
}
