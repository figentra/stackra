/**
 * Stackra file contract:
 * Purpose: `DevRootService`, one service member of the local monolith app as `planDevRoot` finds it: where it is, the
 *          dev port its runway names (lane applied), the Encore database gen declared for it and whether it has
 *          migrations and seeders to run.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 3); ADR 0159 (decision 2); ADR 0190; STA-2840.
 */

/** One service member of a root dev run. */
export type DevRootService = {
  /** The member key, its folder name (`billing`). */
  readonly key: string;

  /** The absolute member root. */
  readonly root: string;

  /** Its runway's dev port with the lane applied, which `stackra dev` forwards to the gateway; none when unset. */
  readonly port?: number | undefined;

  /** The Encore database gen declared (`new SQLDatabase("<name>")`); none when the member has no database. */
  readonly database?: string | undefined;

  /** Whether gen compiled migrations for it (`.stackra/migrations`). */
  readonly migrations: boolean;

  /** Whether gen wrote its seed entry (`.stackra/entry/seed.ts`). */
  readonly seeders: boolean;
};
