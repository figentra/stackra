/**
 * Stackra file contract:
 * Purpose: `ColumnChange`, the chain `t.change(column)` returns inside `schema.table(...)`: make an existing column
 *          nullable or NOT NULL, change its type, or give it a default read from a custom setting, as a frozen migration step with a derived inverse.
 * Boundary: a type only; the migration compiler records the calls and writes `ALTER COLUMN` statements. Every value is
 *           a literal in the migration (the frozen snapshot rule): a type change states the type it had (`from`), so
 *           the inverse is derived without reading the database. Only on an existing table; a table being created
 *           defines its columns as they should be.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (decision 3: expand and contract; literal snapshots).
 */

/** A change of one existing column. */
export interface ColumnChange {
  /** `DROP NOT NULL`, an expand step; its inverse sets NOT NULL again. */
  nullable: () => this;

  /**
   * `SET NOT NULL`, a contract step: Postgres scans the table under an exclusive lock and fails on a null row, so the
   * backfill (a queue job) ships in an earlier release. Its inverse drops NOT NULL. A new contract step passes
   * `{ safe: true }`: ADR 0159's sequence, `ADD CONSTRAINT ck_<table>_<column>_not_null CHECK (column IS NOT NULL) NOT
   * VALID` in the transactional step, then a later step that validates it (writes go on during the scan), sets NOT NULL
   * (proven by the valid check, no second scan) and drops the check. The released contract steps keep the plain form,
   * so their checksums stay the same.
   */
  notNull: (options?: { readonly safe?: boolean }) => this;

  /**
   * `ALTER COLUMN ... TYPE to USING ...`. `to` and `options.from` are SQL types the blueprint writes (`text`,
   * `varchar(64)`, `char(3)`, `integer`, `bigint`, `numeric(12, 4)`, `boolean`, `timestamptz`, `uuid`, `jsonb`,
   * `tsvector`, `ltree`); `using` is the conversion expression, `"<column>"::<to>` by default. The inverse converts back
   * to `from`. A change that rewrites the table (most do, except widening a `varchar` or `varchar` to `text`) holds an
   * exclusive lock for the rewrite: on a large table, add a new column and backfill it instead.
   */
  type: (to: string, options: { readonly from: string; readonly using?: string }) => this;

  /**
   * `SET DEFAULT nullif(current_setting(setting, true), '')`, on a column that has no default: a row written without
   * the column takes the transaction's setting, and NULL when it is unset or empty, so a NOT NULL column refuses the
   * write. It fills a column the ORM never writes, such as an implicit many-to-many pivot's `tenant_id`. Its inverse
   * drops the default.
   */
  defaultSetting: (setting: string) => this;
}
