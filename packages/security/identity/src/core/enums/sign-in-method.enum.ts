/**
 * Stackra file contract:
 * Purpose: `SignInMethod`, the built-in ways a member signs in: a password, a passkey, a code by text message, a code
 *          by email, and approving on the signed-in mobile app.
 * Boundary: an `Enum.of` value plus the type of the same name. Which methods a market offers, in which order, is
 *           market-pack data under `IdentityConfig.signInMethodsKey`, and a scope switches one off by setting; external
 *           providers (a national ID service) are `signInProvidersOf`'s, not listed here.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); owner round 3 #21; ADR 0370.
 */
import { Enum } from "@stackra/contracts";

/** The built-in sign-in methods. */
export const SignInMethod = Enum.of({
  /** A password. */
  Password: "password",
  /** A passkey (WebAuthn). */
  Passkey: "passkey",
  /** A one-time code by text message. */
  PhoneCode: "phone_code",
  /** A one-time code by email. */
  EmailCode: "email_code",
  /** Approving on the signed-in mobile app, by number matching or a QR code. */
  AppApproval: "app_approval",
});

/** One of the codes above. */
export type SignInMethod = Enum.Value<typeof SignInMethod>;
