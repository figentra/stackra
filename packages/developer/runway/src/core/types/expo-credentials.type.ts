/**
 * Stackra file contract:
 * Purpose: `ExpoCredentials`, which credentials EAS holds for one app, per platform: signing (iOS distribution
 *          certificate and provisioning profile, Android keystore) and push (the APNs key, the FCM v1 service-account
 *          key).
 * Boundary: type only; presence flags, never a credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decisions 3 and 5).
 */

/** What EAS holds for one app. */
export type ExpoCredentials = {
  /** iOS signing and the APNs key. */
  readonly ios: { readonly signing: boolean; readonly push: boolean };
  /** The Android keystore and the FCM v1 key. */
  readonly android: { readonly signing: boolean; readonly push: boolean };
};
