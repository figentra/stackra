/**
 * Stackra file contract:
 * Purpose: `OriginLock`, how a regional API origin admits the edge Worker alone: through a Cloudflare Tunnel, or through
 *          authenticated origin pulls (mTLS) on its zone. Either way an Access application on the origin host admits
 *          only the Worker's service token (the allow-list).
 * Boundary: an `Enum.of` value plus the type of the same name; `edgeWorker` declares the resources of each mode.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 5: the origin accepts traffic only from the Worker), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per origin lock. */
export const OriginLock = Enum.of({
  /** The origin dials out through a named Cloudflare Tunnel and has no public ingress. */
  Tunnel: "tunnel",
  /** The origin is public but verifies Cloudflare's client certificate (authenticated origin pulls). */
  Mtls: "mtls",
});

/** One of the codes above. */
export type OriginLock = Enum.Value<typeof OriginLock>;
