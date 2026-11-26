/**
 * Stackra file contract:
 * Purpose: `SchemaBuilder`, what a migration's `up(schema)` receives: create or change a table of the module's
 *          Postgres schema, rename one (expand) and finish the rename or drop one (contract, gated on an earlier
 *          release), run a raw statement with its stated inverse, refuse a contract step while a column still holds
 *          nulls or a backfill has rows to reach, create an approved extension, or write a system lookup or claim
 *          function.
 * Boundary: a type only; the migration compiler records the calls and writes ordered SQL steps with derived inverses.
 *           Table names are literals relative to the module's schema. A migration writes no data (backfills are
 *           `Backfill` queue jobs; `requireBackfill` only reads) and no `down()`.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0294 and ADR 0305 (decision 3: expand and contract, backfills as queue
 *                     jobs); ADR 0160 (approved extensions); ADR 0239 (2026-11-07 amendment, gap A: `systemFunction`).
 */
import type { Extension } from "#core/enums/extension.enum";
import type { Blueprint } from "#core/types/blueprint.type";
import type { ContractOptions } from "#core/types/contract-options.type";
import type { SystemFunctionOptions } from "#core/types/system-function-options.type";

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
   * `options.where` counts only the null rows that also meet it (SQL over the table's columns, a literal): the platform
   * form keeps a platform row's null and refuses only a row whose scope path names a tenant.
   */
  refuseNulls: (
    column: string,
    tables: readonly string[],
    remedy: string,
    options?: { readonly where?: string },
  ) => void;

  /**
   * The expand step of a table rename: renames `from` to `to` and leaves a view named `from` over it
   * (`security_invoker`, so the caller's grants and row-level security apply), through which the release that still
   * names `from` keeps reading and writing (a one-table view is updatable). Rows, indexes, constraints, policies and
   * triggers move with the table and keep their names (`idx_<from>_…`, `pol_<from>_…`): a later `dropIndex`,
   * `dropCheck` or `dropRowLevelSecurity` names `from` as their `table`. `finishRename` drops the view in a later
   * release. The view shows the columns `from` had; one added later is reached through `to` only.
   */
  rename: (from: string, to: string) => void;

  /**
   * The contract step of a table rename, in a later release than `rename`: drops the view `from`, gated on `after` as
   * every contract step is (`stackra db migrate` refuses it while `after` was applied by the same run). Its dev inverse
   * creates the view again over `to`.
   */
  finishRename: (from: string, to: string, options: ContractOptions) => void;

  /**
   * Drops `table`, a contract step gated on `after` (the release that stopped the code using it). Postgres refuses it
   * while another object depends on it (a foreign key, a view), so those go first. Irreversible: the dev inverse is
   * none, so a migration that drops a table is not rolled back; put the drop in a migration of its own.
   */
  drop: (table: string, options: ContractOptions) => void;

  /**
   * The data gate of a contract step: refuses the migration while any row of `options.table` meets `options.pending`
   * (SQL over its columns, a literal), naming the backfill `key` to run first (`Backfill({ key })`). Called before the
   * calls it guards; it reads, never writes, and undoes nothing. A fresh database has no rows, so it passes there.
   */
  requireBackfill: (
    key: string,
    options: { readonly table: string; readonly pending: string },
  ) => void;

  /** Creates one of the approved extensions, if the database does not have it; a down keeps it, since it is shared. */
  createExtension: (extension: Extension) => void;

  /**
   * Creates the ICU collation `name` in the module's schema for `locale` (a BCP 47 tag with ICU keywords, such as
   * `ar-u-kn-true`), which a text column then names with `collate(name)`. Which locale a module sorts by is the
   * migration's literal, taken from the market pack the module serves; nothing here picks one.
   */
  createCollation: (name: string, locale: string) => void;

  /**
   * Writes a system lookup or claim function in the module's schema (ADR 0239 amendment, gap A): a provider webhook
   * finding which tenant owns an id, or the outbox relay, the queue worker, the scheduler or a workflow tick claiming
   * due rows across tenants, returning ids and the tenant id only, then loading each row in `CallIsolation` for its
   * tenant. The body is the package's (ordering, limits, `FOR UPDATE SKIP LOCKED`, the lease update), over tables that
   * declare `t.systemAccess`. The helper enforces the rest: `language sql`, `SECURITY DEFINER` owned by
   * `SYSTEM_ACCESS_ROLE` (created when missing), `SET search_path = pg_catalog, pg_temp` (the body names its schema),
   * `RETURNS TABLE` of the declared columns, `EXECUTE` revoked from `PUBLIC` and granted to the migrating role, the
   * service's own. A non-superuser migrator holds the role and its schema's `CREATE` only for the owner change, inside
   * the migration's transaction. The reason is required and one line; the compiled migration carries
   * `-- stackra:system-function <schema>.<name> <reason>`, and `stackra row-security-declarations` lists it.
   */
  systemFunction: (options: SystemFunctionOptions) => void;
}
