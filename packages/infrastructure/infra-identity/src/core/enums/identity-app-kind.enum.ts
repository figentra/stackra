/**
 * Stackra file contract:
 * Purpose: the kinds of OIDC client the seed declares, one per app: the web BFF and the native client of mobile,
 *          desktop and the CLI. Both use the authorization code with PKCE and hold no client secret.
 * Boundary: an `Enum.of` value plus the type of the same name; the Pulumi slice maps each kind to ZITADEL's app type.
 *           There is no browser-only client: the web signs in through the BFF (ADR 0206 decision 8).
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8: BFF on the web, PKCE on devices), ADR 0241 (decisions 2 and 4), ADR 0277
 *                     (decisions 1 and 2: loopback and device code), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** How an app signs in. */
export const IdentityAppKind = Enum.of({
  /** The web BFF: a server-side web client whose callback is an `https://` route and whose session is a cookie. */
  Bff: "bff",
  /** A native client (mobile, desktop, CLI): a custom-scheme or loopback callback, and the device code when asked. */
  Native: "native",
});

/** One of the codes above. */
export type IdentityAppKind = Enum.Value<typeof IdentityAppKind>;
