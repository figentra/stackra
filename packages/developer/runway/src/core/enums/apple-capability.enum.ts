/**
 * Stackra file contract:
 * Purpose: `AppleCapability`, the bundle id capabilities mobile onboarding enables, as App Store Connect's
 *          `capabilityType` names them: push notifications, Sign in with Apple and associated domains.
 * Boundary: an `Enum.of` value plus the type of the same name. App groups stay a browser step (ADR 0480 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decision 1), ADR 0480 (decision 4).
 */
import { Enum } from "@stackra/contracts";

/** One case per capability onboarding enables. */
export const AppleCapability = Enum.of({
  /** Push, when the app lists the `push` capability. */
  PushNotifications: "PUSH_NOTIFICATIONS",
  /** Sign in with Apple, when the app offers `apple` sign-in. */
  SignInWithApple: "APPLE_ID_AUTH",
  /** Universal links, when the app names `identity.links`. */
  AssociatedDomains: "ASSOCIATED_DOMAINS",
});

/** One of the codes above. */
export type AppleCapability = Enum.Value<typeof AppleCapability>;
