/**
 * Stackra file contract:
 * Purpose: the `EventSigner` port: how a producer signs one cross-app delivery, so the consumer's inbox can tell which
 *          producer sent it. The relay hands it the delivery id, the signing time and the exact body; it answers the
 *          request headers that carry the signature.
 * Boundary: an abstract class that is its own token, keyed `outbox.EventSigner`. The signing key never leaves the
 *           driver and is never logged. STA-1792's workload identity later replaces the driver, not the port. A leaf
 *           file.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 16, amendment of 2026-11-02); ADR 0173; ADR 0294 (decisions 4, 15
 *                     and 16).
 */
import { Port } from "@stackra/contracts";

/**
 * Signs cross-app deliveries.
 *
 * @example
 * export class Ed25519EventSignerDriver extends Driver(EventSigner) {
 *   async sign(id: string, at: Date, body: string): Promise<Readonly<Record<string, string>>> { ... }
 * }
 */
export abstract class EventSigner extends Port {
  /** Type-only port key, so `DriverName<EventSigner>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.EventSigner";

  /** The headers that sign `body`, sent as delivery `id` at `at`. */
  abstract sign(id: string, at: Date, body: string): Promise<Readonly<Record<string, string>>>;
}
