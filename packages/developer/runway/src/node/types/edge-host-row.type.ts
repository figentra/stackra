/**
 * Stackra file contract:
 * Purpose: `EdgeHostRow`, the value of a platform `host:<hostname>` row: the product, surface, home region, status,
 *          sign-in realm and canonical host.
 * Boundary: type only; `platformRows` builds it. A platform row has no scope: scope rows are the edge projector's
 *           (Runway is the only writer of platform rows, the projector of scope rows).
 * Runtime: node
 * Governing contract: ADR 0437 (the KV copy); app-shells 5.1 (steps 1 and 2) and 5.3; owner decisions D2 (canonical
 *                     host) and D9 (host pattern).
 */

/** A platform host's row. */
export type EdgeHostRow = {
  /** The product the host belongs to. */
  readonly product: string;
  /** The surface key the host serves. */
  readonly surface: string;
  /** The region the API calls go to. */
  readonly region: string;
  /** The host's status (`active`). */
  readonly status: string;
  /** The sign-in realm of the host's surface (`tenant`). */
  readonly realm: string;
  /** The host search engines index; the same for every host of the surface. */
  readonly canonical: string;
  /** The shell preset the surface runs (`portal`, ADR 0436 decision 10); absent for the shell's own default. */
  readonly preset?: string;
};
