/**
 * Stackra file contract:
 * Purpose: `SchemaBuilder`, what a migration's `up(schema)` receives: create or change a table of the module's
 *          Postgres schema, run a raw statement with its stated inverse, refuse a contract step while a column still
 *          holds nulls, or create an approved extension.
 * Boundary: a type only; the migration compiler records the calls and writes ordered SQL steps with derived inverses.
 *           Table names are literals relative to the module's schema. A migration writes no data (backfills are
 *           queue jobs) and no `down()`.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0294 and ADR 0305; ADR 0160 (approved extensions).
 */
import type { Extension } from "#core/enums/extension.enum";
import type { Blueprint } from "#core/types/blueprint.type";

/**
 * The module schema a migration changes.
 *
 * @example
 * up(schema: SchemaBuilder): void {
 *   schema.createExtension(Extension.Trigram);
 *   schema.table("orders", (t: Blueprint) => {
 *     t.timestamp("paid_at").nullable().comment("When the payment was captured.");
 *   });
 * }
 */
export interface SchemaBuilder {
  /** Creates `table`; its indexes build inside the migration's transaction. */
  create: (table: string, define: (t: Blueprint) => void) => void;

  /** Changes the existing `table`: added columns are nullable or defaulted, indexes are built concurrently. */
  table: (table: string, define: (t: Blueprint) => void) => void;

  /**
   * A statement a blueprint cannot express (an operator class, a trigger), with the statement that undoes it on dev
   * databases, or `false` when nothing can. A `CONCURRENTLY` statement compiles to its own non-transactional step.
   */
  sql: (statement: string, options: { readonly inverse: string | false }) => void;

  /**
   * The pre-flight of a contract step: refuses the migration while any row of `tables` holds a null `column`, with one
   * error naming each such table's count and `remedy` (the backfill to run first). Called before the `schema.table`
   * calls it guards, it is the first statement of their transaction, so a refusal changes nothing; it undoes nothing.
   */
  refuseNulls: (column: string, tables: readonly string[], remedy: string) => void;

  /** Creates one of the approved extensions, if the database does not have it; a down keeps it, since it is shared. */
  createExtension: (extension: Extension) => void;

  /**
   * Creates the ICU collation `name` in the module's schema for `locale` (a BCP 47 tag with ICU keywords, such as
   * `ar-u-kn-true`), which a text column then names with `collate(name)`. Which locale a module sorts by is the
   * migration's literal, taken from the market pack the module serves; nothing here picks one.
   */
  createCollation: (name: string, locale: string) => void;
}
