/**
 * Stackra file contract:
 * Purpose: the `EdgeNonceStore` port: the short-lived store of request ids the API has already accepted on the
 *          signed edge headers, so a captured request cannot be replayed inside the validity window.
 * Boundary: an abstract class that is its own token, keyed `app.EdgeNonceStore`. `claim` must be atomic: of two
 *           concurrent claims of one id, exactly one wins. The shipped `memory` driver holds one process's ids; a
 *           region with several API instances binds a shared driver (a cache with set-if-absent) by wiring.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 4 and Consequences: a short-lived store of seen request ids per region).
 */
import { Port } from "@stackra/contracts";

/**
 * Seen edge request ids.
 *
 * @example
 * if (!(await nonces.claim(requestId, 120))) throw EdgeSignatureInvalidError.create();
 */
export abstract class EdgeNonceStore extends Port {
  /** Type-only port key, so `DriverName<EdgeNonceStore>` narrows to this port's drivers. */
  declare readonly "~key": "app.EdgeNonceStore";

  /** Records `nonce` for `ttlSeconds`; false when it is already recorded and not yet expired. */
  abstract claim(nonce: string, ttlSeconds: number): Promise<boolean>;
}
