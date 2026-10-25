/**
 * Stackra file contract:
 * Purpose: `PushTarget`, one registered device a push is sent to: an Expo push token (the mobile app) or a Web Push
 *          subscription (the browser's endpoint and keys).
 * Boundary: a type only. Targets are stored by the notifications service per principal; a target the provider reports
 *           dead is revoked through `PushTokenStore`.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1: web push with VAPID); RFC 8030; RFC 8291.
 */

/** A device to push to. */
export type PushTarget =
  | {
      readonly kind: "expo";
      /** `ExponentPushToken[…]`. */
      readonly token: string;
    }
  | {
      readonly kind: "web";
      /** The push service URL the browser gave. */
      readonly endpoint: string;
      /** The browser's P-256 public key, base64url. */
      readonly p256dh: string;
      /** The browser's auth secret, base64url. */
      readonly auth: string;
    };
