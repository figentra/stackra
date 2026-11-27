/**
 * Stackra file contract:
 * Purpose: `contractAfterFilePattern(after)`, the pattern of the compiled file names of the migration `after`
 *          (`orders.0007_stop_writing_note` → `^[0-9]+_orders_0007_stop_writing_note(_[0-9]+)?$`): gen names a step file
 *          `<seq>_<module>_<NNNN>_<stem>[_<n>]`. A release gate matches the ledger's `name` with it in Postgres, and
 *          `migrate` matches its pending files with it before any change.
 * Boundary: pure; the id holds only `[a-z0-9_.]` (`MIGRATION_ID_PATTERN`), so the pattern needs no escape and reads the
 *           same as a POSIX (Postgres `~`) and a JavaScript regular expression. The caller checks the id first.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24: the `N_name.up.sql` numbering; decision 3).
 */

/**
 * The file-name pattern of the migration `after`.
 *
 * @example
 * contractAfterFilePattern("orders.0007_stop_writing_note"); // "^[0-9]+_orders_0007_stop_writing_note(_[0-9]+)?$"
 */
export function contractAfterFilePattern(after: string): string {
  return `^[0-9]+_${after.replace(".", "_")}(_[0-9]+)?$`;
}
