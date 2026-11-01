/**
 * Stackra file contract:
 * Purpose: `formatSchemaDifference`, the one line `stackra db diff` prints for a difference:
 *          `<module>  <table>  <kind>  <subject>  <expected>  <actual>`, fields joined by two spaces.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 3: `stackra db diff`); STA-1808.
 */
import type { SchemaDifference } from "#core/types/schema-difference.type";

/**
 * The printed line of `difference`.
 *
 * @example
 * formatSchemaDifference(difference);
 * // "invoicing  tax_documents  missing_column  due_at  timestamptz  -"
 */
export function formatSchemaDifference(difference: SchemaDifference): string {
  return [
    difference.module,
    difference.table,
    difference.kind,
    difference.subject,
    difference.expected,
    difference.actual,
  ].join("  ");
}
