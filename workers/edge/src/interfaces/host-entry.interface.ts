/**
 * Stackra file contract:
 * Purpose: `HostEntry`: what one hostname means at the edge — the product, surface and identity realm, and the scope id
 *          of a tenant host (null on a platform host).
 * Boundary: types only; `readSettings` parses the host map into these.
 * Runtime: worker
 * Governing contract: ADR 0437 (decisions 2.1 and 6: the `host:<hostname>` row).
 */

/** What one hostname means at the edge. */
export interface HostEntry {
  /** The product key. */
  readonly product: string;
  /** The surface key (`console`, `landing`, `till`). */
  readonly surface: string;
  /** The identity realm of the host. */
  readonly realm: string;
  /** The tenant's scope id, or null on a platform host. */
  readonly scope: string | null;
}
