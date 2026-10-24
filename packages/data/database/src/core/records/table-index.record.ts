/**
 * Stackra file contract:
 * Purpose: `TableIndexRecord`, the recorded state of one blueprint index and its `CREATE INDEX` statement.
 * Boundary: internal; the runtime side of `TableIndex`. The blueprint decides whether it builds in the transaction (a
 *           new table) or as its own online step (an existing table).
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3); ADR 0231 (`idx_`).
 */
import { constraintName } from "#core/functions/constraint-name.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import type { IndexMethod } from "#core/types/index-method.type";
import type { TableIndex } from "#core/types/table-index.type";

/** The access methods an index may name. */
const METHODS: readonly IndexMethod[] = ["btree", "gin", "gist", "brin", "hash"];

/** One recorded index. */
export class TableIndexRecord implements TableIndex {
  /** The indexed columns, in order. */
  readonly columns: readonly string[];

  /** Whether two rows may not share the values. */
  readonly unique: boolean;

  /** Whether `concurrently()` was called. */
  online = false;

  /** The access method, when one was named. */
  method: IndexMethod | undefined = undefined;

  /** The partial index predicate, when there is one. */
  predicate: string | undefined = undefined;

  /**
   * @param columns - the indexed columns, at least one.
   * @param unique - whether it is a unique index.
   * @throws TypeError for no columns or a column that is not snake_case.
   */
  constructor(columns: readonly string[], unique: boolean) {
    if (columns.length === 0) throw new TypeError("An index needs at least one column");
    for (const column of columns) quoteIdentifier(column);
    this.columns = Object.freeze([...columns]);
    this.unique = unique;
  }

  /** See `TableIndex.concurrently`. */
  concurrently(): this {
    this.online = true;
    return this;
  }

  /**
   * See `TableIndex.using`.
   *
   * @throws TypeError for an unknown access method.
   */
  using(method: IndexMethod): this {
    if (!METHODS.includes(method))
      throw new TypeError(`"${method}" is not an index method (${METHODS.join(", ")})`);
    this.method = method;
    return this;
  }

  /**
   * See `TableIndex.where`.
   *
   * @throws TypeError for a blank predicate.
   */
  where(predicate: string): this {
    if (predicate.trim() === "") throw new TypeError("A partial index predicate is blank");
    this.predicate = predicate;
    return this;
  }

  /** The index name on `table`. */
  name(table: string): string {
    return constraintName("idx", table, this.columns);
  }

  /** The `CREATE INDEX` statement on `qualified`, concurrent when `online`. */
  sql(table: string, qualified: string, online: boolean): string {
    const unique = this.unique ? "unique " : "";
    const concurrently = online ? "concurrently " : "";
    const method = this.method === undefined ? "" : ` using ${this.method}`;
    const columns = this.columns.map(quoteIdentifier).join(", ");
    const where = this.predicate === undefined ? "" : ` where ${this.predicate}`;
    return `create ${unique}index ${concurrently}${quoteIdentifier(this.name(table))} on ${qualified}${method} (${columns})${where}`;
  }
}
