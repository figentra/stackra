/**
 * Stackra file contract:
 * Purpose: `ConsumerGateProduct`, one product of the consumer gate matrix: repository, its pin, the services to gate
 *          and the services overlaid.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); ADR 0484; STA-1813.
 */

/** One product the gate runs against a core tree. Exactly one of `ref` and `pins` is set. */
export type ConsumerGateProduct = {
  /** The product repository, `owner/name`. */
  readonly repo: string;

  /** The commit every service of the product is pinned to. */
  readonly ref?: string;

  /** A commit per service, when the services sit on different branches; one run gates services of one pin. */
  readonly pins?: Readonly<Record<string, string>>;

  /** The services to gate. */
  readonly services: readonly string[];

  /** The services whose manifests are copied from the caller's overlay directory. */
  readonly overlays?: readonly string[];

  /** A narrower step list than every step. */
  readonly steps?: readonly string[];
};
