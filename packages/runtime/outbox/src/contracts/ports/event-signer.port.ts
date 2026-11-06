/**
 * Stackra file contract:
 * Purpose: the `EventSigner` port: signs one cross-app delivery request as the producer, over
 *          `<webhook-id>.<webhook-timestamp>.<body>`.
 * Boundary: an abstract class that is its own token, keyed `outbox.EventSigner`. The first driver is
 *           `Ed25519EventSignerDriver`; STA-1792's workload identity later replaces it. A signer never logs a key. A leaf
 *           file.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 16, amendment of 2026-11-02); ADR 0173.
 */
import { Port } from "@stackra/contracts";

import type { SignedHeaders } from "#contracts/types/signed-headers.type";

/**
 * Signs cross-app deliveries.
 *
 * @example
 * const headers = await signer.sign(delivery.id, now, body);
 */
export abstract class EventSigner extends Port {
  /** Type-only port key, so `DriverName<EventSigner>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.EventSigner";

  /**
   * The signature headers of `body` sent as delivery `id` at `at`.
   *
   * @throws Error when the signing key is not bound or cannot be read.
   */
  abstract sign(id: string, at: Date, body: string): Promise<SignedHeaders>;
}
