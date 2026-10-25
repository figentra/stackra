/**
 * Stackra file contract:
 * Purpose: `ExpoSignInBrowserDriver`, the `SignInBrowser` of an Expo app: the redirect URI is the app's own scheme
 *          link for the configured path (`expo-linking`), and the hosted sign-in opens in the system's
 *          authentication session (`expo-web-browser`), which hands back the URL the provider redirected to.
 * Boundary: the platform step only; the code and the state are `PkceSessionStoreDriver`'s to check. A closed or
 *           dismissed session answers `null`, which the PKCE driver turns into `sign_in_cancelled`.
 * Runtime: react-native
 * Governing contract: ADR 0206 (decision 8); ADR 0241 (decision 4); ADR 0268 (R3: the provider's hosted sign-in).
 */
import { Driver } from "@stackra/container";
import { createURL } from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";

import { SignInBrowser } from "#contracts/index";

/**
 * Signs in through the system's authentication session.
 *
 * @example
 * // generated .stackra/mobile/wiring.ts
 * { port: SignInBrowser, candidates: { expo: () => import("@stackra/identity/native").then((m) => m.ExpoSignInBrowserDriver) } }
 */
export class ExpoSignInBrowserDriver extends Driver(SignInBrowser) {
  /** The app's link for `path` (`acme://auth/callback`). */
  redirectUri(path: string): string {
    return createURL(path);
  }

  /** Opens `url`; the URL the provider redirected to, or `null` when the user closed it. */
  async authorize(url: string, redirectUri: string): Promise<string | null> {
    const result = await openAuthSessionAsync(url, redirectUri);
    return result.type === "success" ? result.url : null;
  }
}
