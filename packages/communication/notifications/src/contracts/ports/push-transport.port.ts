/**
 * Stackra file contract:
 * Purpose: the `PushTransport` port: sends one push to one device and revokes the device when the push service says it
 *          is gone.
 * Boundary: an abstract class that is its own token. The `device` driver (`DevicePushTransportDriver`) sends Expo pushes
 *           through the Expo Integration and Web Push itself (VAPID, RFC 8291 encryption); a test binds a fake.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0294 (decisions 15 to 17); ADR 0305 (rule 8).
 */
import { Port } from "@stackra/contracts";

import type { OutboundPush } from "#contracts/types/outbound-push.type";
import type { PushOutcome } from "#contracts/types/push-outcome.type";

/**
 * Sends pushes to Expo and Web Push devices.
 *
 * @example
 * const outcome = await push.send(message, delivery.commandKey);
 */
export abstract class PushTransport extends Port {
  /**
   * Sends `push` once per `idempotencyKey`.
   *
   * @returns `sent`, or `revoked` when the device is gone.
   */
  abstract send(push: OutboundPush, idempotencyKey: string): Promise<PushOutcome>;
}
