/**
 * Stackra file contract:
 * Purpose: `CanonicalHost`, which of a landing site's two hosts is canonical for search engines when the product has a
 *          domain of its own: the platform host under the environment's zone, or the product's own domain.
 * Boundary: an `Enum.of` value plus the type of the same name. The choice is runway data
 *           (`surfaces.landing.canonical`); `edgeRowsOf` writes it into both `host:` rows.
 * Runtime: isomorphic
 * Governing contract: ADR 0440 (decision 6: two host rows, one marked canonical; owner decision D2 of 2026-10-26).
 */
import { Enum } from "@stackra/contracts";

/** One case per host. */
export const CanonicalHost = Enum.of({
  /** The platform host, `<host>.<zone>`. */
  Platform: "platform",
  /** The product's own domain for that environment. */
  Own: "own",
});

/** One of the codes above. */
export type CanonicalHost = Enum.Value<typeof CanonicalHost>;
