/**
 * Stackra file contract:
 * Purpose: `OutboundPush`, one push notification as a `PushTransport` driver sends it: the device, the title and body
 *          already translated, data for the app, how long the push service may hold it, and the Android channel it
 *          shows on.
 * Boundary: a type only. A push shows on a lock screen, so a restricted record's push is its content-free variant.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0348 (decision 5: what a lock screen may show); ADR 0255 (2026-10-29
 *                     note: one Android channel per category).
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

  /**
   * The Android notification channel it shows on (the notification's category code, a `PushConfig.androidChannels`
   * id), so the person mutes or changes that category in the system settings; absent uses the app's default channel.
   */
  readonly channelId?: string;
}
