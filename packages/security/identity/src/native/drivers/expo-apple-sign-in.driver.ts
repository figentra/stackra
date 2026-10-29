/**
 * Stackra file contract:
 * Purpose: `ExpoAppleSignInDriver`, the `AppleSignIn` of an Expo app on iOS: the Sign in with Apple sheet through
 *          `expo-apple-authentication`, with the library's error codes mapped to `AppleSignInRefusal`.
 * Boundary: the device step only, a pass-through: the server's nonce goes in, Apple's token comes out. The library is
 *           NOT a dependency of this package (it is not in the catalog yet, STA-1578): the driver requires it when
 *           first used and throws a clear error naming it when the app has not installed it. The app needs the
 *           `com.apple.developer.applesignin` entitlement (runway's `signIn.social` with `apple` sets it).
 * Runtime: react-native
 * Governing contract: ADR 0206 (decision 8); ADR 0478 (decision 2: native code the app links); STA-1578 (App Store
 *                     guideline 4.8).
 */
import { Driver } from "@stackra/container";

import { AppleSignIn, AppleSignInRefusal } from "#contracts/index";
import type { AppleSignInResult } from "#contracts/index";
import type { AppleAuthenticationModule } from "#native/types/apple-authentication-module.type";

/** The library's cancel code; every other code is `failed`. */
const CANCELLED = "ERR_REQUEST_CANCELED";

/**
 * Sign in with Apple on an iPhone or iPad.
 *
 * @example
 * // generated .stackra/mobile/wiring.ts
 * { port: AppleSignIn, candidates: { expo: () => import("@stackra/identity/native").then((m) => m.ExpoAppleSignInDriver) } }
 */
export class ExpoAppleSignInDriver extends Driver(AppleSignIn) {
  /** Whether the sheet can show here (iOS 13 and later). */
  async isAvailable(): Promise<boolean> {
    return this.library().isAvailableAsync();
  }

  /** Shows the sheet for `nonce`, asking for the name and email. */
  async signIn(nonce: string): Promise<AppleSignInResult> {
    const library = this.library();
    if (!(await library.isAvailableAsync())) {
      return { ok: false, error: AppleSignInRefusal.Unsupported };
    }
    try {
      const { AppleAuthenticationScope: scope } = library;
      const credential = await library.signInAsync({
        requestedScopes: [scope.FULL_NAME, scope.EMAIL],
        nonce,
      });
      if (credential.identityToken === null) return { ok: false, error: AppleSignInRefusal.Failed };
      const name = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter((part): part is string => typeof part === "string" && part !== "")
        .join(" ");
      return {
        ok: true,
        data: {
          identityToken: credential.identityToken,
          authorizationCode: credential.authorizationCode,
          user: credential.user,
          email: credential.email,
          name: name === "" ? null : name,
        },
      };
    } catch (error) {
      const code = (error as { code?: unknown } | null)?.code;
      if (typeof code !== "string") throw error;
      return {
        ok: false,
        error: code === CANCELLED ? AppleSignInRefusal.Cancelled : AppleSignInRefusal.Failed,
      };
    }
  }

  /** `expo-apple-authentication`, or a clear error when the app has not installed it. */
  protected library(): AppleAuthenticationModule {
    try {
      // A literal require inside try: Metro treats it as optional, so an app without the library still bundles.
      return require("expo-apple-authentication") as AppleAuthenticationModule;
    } catch (error) {
      throw new Error(
        "Sign in with Apple needs expo-apple-authentication: add it to the app's dependencies (catalog:mobile) " +
          "and rebuild the native app, or use externalSignIn('apple', …) through the hosted sign-in",
        { cause: error },
      );
    }
  }
}
