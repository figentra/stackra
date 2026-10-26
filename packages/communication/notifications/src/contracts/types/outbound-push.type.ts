/**
 * Stackra file contract:
 * Purpose: `OutboundPush`, one push notification as a `PushTransport` driver sends it: the device, the title and body
 *          already translated, data for the app, and how long the push service may hold it.
 * Boundary: a type only. A push shows on a lock screen, so a restricted record's push is its content-free variant.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0348 (decision 5: what a lock screen may show).
 */
import type { PushTarget } from "#contracts/types/push-target.type";

/** A push ready to send. */
export interface OutboundPush {
  /** The device to push to. */
  readonly target: PushTarget;

  /** The push's title. */
  readonly title: string;

  /** The push's body text. */
  readonly body: string;

  /** Data the app reads (a route to open); no personal data. */
  readonly data?: Readonly<Record<string, string>>;

  /** Seconds the push service may hold it for an offline device. */
  readonly ttlSeconds: number;
}
