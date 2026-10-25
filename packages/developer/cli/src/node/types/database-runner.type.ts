/**
 * Stackra file contract:
 * Purpose: `DatabaseRunner`, what the `stackra db` commands call in the member's `@stackra/database/node`: `migrate`
 *          applies the pending migrations in order and `rollback` reverts the last batch, each answering with the
 *          migration names it touched.
 * Boundary: type only. The CLI declares the shape it needs and imports the module from the member at run time, so
 *           the CLI never bundles or depends on MikroORM.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24: `stackra db migrate`; rollback on dev, preview and
 *                     test only); ADR 0282 (decision 3).
 */

/** The database runner of one member. */
export type DatabaseRunner = {
  /** Applies the member's pending migrations in order; resolves with the names it applied. */
  readonly migrate: (options: {
    readonly cwd: string;
    readonly environment: string;
  }) => Promise<{ readonly applied: readonly string[] }>;

  /** Reverts the member's last migration batch; resolves with the names it reverted, last first. */
  readonly rollback: (options: {
    readonly cwd: string;
    readonly environment: string;
  }) => Promise<{ readonly reverted: readonly string[] }>;
};
