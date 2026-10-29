/**
 * Stackra file contract:
 * Purpose: the `AppleSignIn` port: the device step of native Sign in with Apple on iOS, the system sheet
 *          (`ASAuthorizationAppleIDProvider`) that hands back Apple's identity token for a nonce the server chose.
 * Boundary: an abstract class that is its own token, keyed `identity.AppleSignIn`. The driver never checks the token:
 *           the server checks it and exchanges it with the identity provider (ZITADEL's Apple provider). An app that
 *           only needs App Store guideline 4.8 does not need this port at all: `externalSignIn("apple", …)` sends the
 *           hosted sign-in (the `SignInBrowser`) straight to ZITADEL's Apple provider. Driver: `ExpoAppleSignInDriver`
 *           (`./native`), which needs `expo-apple-authentication` in the app; the app renders that library's
 *           `AppleAuthenticationButton`, Apple's required button.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0268 (R3: no login UI of ours, a button is not a form); STA-1578
 *                     (App Store guideline 4.8).
 */
import { Port } from "@stackra/contracts";

import type { AppleSignInResult } from "#contracts/types/apple-sign-in-result.type";

/**
 * Signs in with Apple on this device.
 *
 * @example
 * const apple = useContainer().get(AppleSignIn);
 * if (await apple.isAvailable()) {
 *   const result = await apple.signIn(await api.appleNonce());
 *   if (result.ok) await api.appleExchange(result.data);
 * }
 */
export abstract class AppleSignIn extends Port {
  /** Type-only port key, so `DriverName<AppleSignIn>` narrows to this port's drivers. */
  declare readonly "~key": "identity.AppleSignIn";

  /** Whether this device can show the Sign in with Apple sheet; the app hides Apple's button when not. */
  abstract isAvailable(): Promise<boolean>;

  /** Shows the sheet for `nonce`, the value the server checks in the token's `nonce` claim. */
  abstract signIn(nonce: string): Promise<AppleSignInResult>;
}
