/**
 * Stackra file contract:
 * Purpose: the `RealtimeTokenLedger` port: the record of signed realtime tokens already redeemed, so a subscribe or
 *          room token is redeemed once across every instance of a service, even when a proxy or access log captured
 *          it from the URL.
 * Boundary: an abstract class that is its own token. `claim` answers true only for the first claim of an id, and keeps
 *           the id until the token's own expiry, after which the signature check refuses the token anyway. Drivers:
 *           memory (one process) and valkey (`SET NX PX`, shared by the instances).
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0346 (decision 3); ADR 0294 (decisions 16 and 17).
 */
import { Port } from "@stackra/contracts";

/** Records redeemed token ids. */
export abstract class RealtimeTokenLedger extends Port {
  /** Type-only port key, so `DriverName<RealtimeTokenLedger>` narrows to this port's drivers. */
  declare readonly "~key": "realtime.RealtimeTokenLedger";

  /**
   * Claims the token `id` until `until`.
   *
   * @returns true for the first claim of `id`; false when it was already claimed.
   */
  abstract claim(id: string, until: Date): Promise<boolean>;
}
