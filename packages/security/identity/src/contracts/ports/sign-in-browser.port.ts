/**
 * Stackra file contract:
 * Purpose: the `SignInBrowser` port: the one platform step of the PKCE flow, opening the provider's hosted sign-in in
 *          the system browser and handing back the URL the provider redirected to.
 * Boundary: an abstract class that is its own token, keyed `identity.SignInBrowser`. The redirect URI is the platform's
 *           fact (the app scheme on a phone, the deep link or loopback on desktop), so the driver builds it from the
 *           configured path. The driver never reads the code or the state; `PkceSessionStoreDriver` checks both. A
 *           platform driver (Expo's auth session, Electron's deep link) implements it; none ships here yet.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0241 (decision 4); ADR 0277 (decisions 1 and 6); ADR 0268 (R3: no
 *                     login UI of ours).
 */
import { Port } from "@stackra/contracts";

/**
 * Opens the hosted sign-in.
 *
 * @example
 * export class MemorySignInBrowserDriver extends Driver(SignInBrowser) {
 *   redirectUri(path: string) { return `acme://${path}`; }
 *   async authorize(url: string, redirectUri: string) {
 *     return `${redirectUri}?code=c1&state=${new URL(url).searchParams.get("state")}`;
 *   }
 * }
 */
export abstract class SignInBrowser extends Port {
  /** Type-only port key, so `DriverName<SignInBrowser>` narrows to this port's drivers. */
  declare readonly "~key": "identity.SignInBrowser";

  /** The redirect URI this platform receives for `path` (`acme://auth/callback`), registered at the provider. */
  abstract redirectUri(path: string): string;

  /** Opens `url` in the system browser; resolves the URL the provider redirected to, or `null` when the user closed it. */
  abstract authorize(url: string, redirectUri: string): Promise<string | null>;
}
