/**
 * Stackra file contract:
 * Purpose: `LicenceGrantView`: one grant: the names of a scope a licence may read (`*` for every name).
 * Boundary: the port and its empty binding only. The D1 adapter over `licences`, `licence_grants` and
 *           `licence_tokens` is stackra-183's (workers/registry licence folder); the read rule over the result is
 *           `readAccess`'s.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 10 and 13); stackra-183 (STA-1335).
 */

/** One grant: the names of a scope a licence may read (`*` for every name). */
export interface LicenceGrantView {
  /** The scope the grant covers. */
  readonly scope: string;
  /** The package names of that scope the licence may read, or `*` for all of them. */
  readonly names: "*" | readonly string[];
}
