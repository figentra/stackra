/**
 * Stackra file contract:
 * Purpose: `BffOptions`, the shape of `BffConfig`: the BFF's confidential-client secret and cookie key, the session
 *          cookie's name, the callback URL, the return origins, the post-logout URL and the session and sign-in
 *          lifetimes.
 * Boundary: a shape class; it registers this package's own schema (`BFF_CONFIG_SCHEMA`) when the module loads. The
 *           issuer, client id and scopes are `IdentityConfig`'s; this holds what only the server knows. The secret
 *           and the key are the `IDENTITY_BFF_CLIENT_SECRET` and `IDENTITY_BFF_COOKIE_KEY` secrets, read from the
 *           secret store; runway's `config.bff` layer sets the rest per environment. Server only: never part of a
 *           browser build.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0173 and ADR 0257; ADR 0206 (decision 8); STA-1566.
 */
import type { Url } from "@stackra/contracts";
import { Secret } from "@stackra/config";
import { Field, Int, registerSchemas, Schema } from "@stackra/validation";

import { BFF_CONFIG_SCHEMA } from "#core/constants/bff-config-schema.constant";

/**
 * The BFF settings.
 *
 * @example
 * export class BffConfig extends BaseBffConfig {
 *   override returnOrigins = ["https://console.acme.example"];
 * }
 */
export class BffOptions extends Schema {
  /** The confidential client's secret, sent with the code exchange; empty for a PKCE-only public client. */
  @Secret("IDENTITY_BFF_CLIENT_SECRET")
  clientSecret = "";

  /** The key the session and sign-in cookies are sealed with (AES-GCM); at least 32 characters. */
  @Secret("IDENTITY_BFF_COOKIE_KEY")
  cookieKey = "";

  /** The callback URL registered at the provider: `<API origin><IdentityConfig.bffEndpoint>/callback`. */
  // reason: a URL or the empty string, a union beyond `T | null`
  @Field(BFF_CONFIG_SCHEMA.shape.redirectUri)
  redirectUri: Url | "" = "";

  /** The app origins a sign-in may return to; the first is where an in-app path resolves. */
  // reason: an origin list whose first entry must be exact
  @Field(BFF_CONFIG_SCHEMA.shape.returnOrigins)
  returnOrigins: string[] = [];

  /** Where the provider sends the browser after sign-out; empty is the first return origin. */
  // reason: a URL or the empty string, a union beyond `T | null`
  @Field(BFF_CONFIG_SCHEMA.shape.postLogoutUri)
  postLogoutUri: Url | "" = "";

  /** Minutes a session cookie lasts. */
  @Int({
    min: 5,
    max: 43_200,
  })
  sessionMinutes = 480;

  /** Minutes a sign-in attempt may take before its state lapses. */
  @Int({
    min: 1,
    max: 60,
  })
  flowMinutes = 10;

  /** The session cookie's name; the sign-in attempt's cookie is this name plus `_flow`. */
  cookieName = "__Host-stackra_session";
}

registerSchemas([[BffOptions, BFF_CONFIG_SCHEMA]]);
