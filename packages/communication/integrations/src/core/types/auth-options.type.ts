/**
 * Stackra file contract:
 * Purpose: `AuthOptions`, an Integration's `auth` option: a discriminated union over the six `AuthType`s, each with
 *          the options that type needs, so an OAuth integration names its endpoints and scopes and an API key
 *          integration names its header.
 * Boundary: a type only; the members are not exported (read one with `Extract<AuthOptions, { type: ... }>`). Every
 *           string that carries a credential is a `{field}` placeholder resolved on the Connection first, then on the
 *           Integration (ADR 0308 rule 4), never a value. The word scope means an OAuth scope only here (rule 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 4 to 8); RFC 6749 (OAuth 2.0); RFC 7636 (PKCE); RFC 7519 (JWT).
 */
import type { AuthType } from "#core/enums/auth-type.enum";
import type { Interval } from "#core/types/interval.type";

/** How a client presents its id and secret at a token endpoint: a Basic header (RFC 6749 2.3.1) or form fields. */
type ClientAuthentication = "basic" | "body";

/** When a token is renewed: `buffer` before its stated expiry, `"60s"` when left out. */
interface RefreshPolicy {
  /** How long before expiry the token is renewed. */
  readonly buffer?: Interval;
}

/** Authorization code with PKCE; the connection holds the tokens and the managed client refreshes them on use. */
interface OAuth2CodeAuth {
  readonly type: typeof AuthType.OAuth2Code;
  /** The provider's authorization endpoint, where the console sends the user to grant access. */
  readonly authorizeUrl: string;
  /** The token endpoint: code exchange and refresh. */
  readonly tokenUrl: string;
  /** The revocation endpoint (RFC 7009); without one, disconnect only destroys the tokens. */
  readonly revokeUrl?: string;
  /** The client id, usually `"{clientId}"`. */
  readonly clientId: string;
  /** The client secret, usually `"{clientSecret}"`; a public client has none. */
  readonly clientSecret?: string;
  /** The OAuth scopes requested at consent; gen fingerprints them, and a change marks connections for re-consent. */
  readonly scopes: readonly string[];
  /** How the client authenticates at the token endpoint; `"basic"` when left out. */
  readonly clientAuthentication?: ClientAuthentication;
  /** When the access token is renewed. */
  readonly refresh?: RefreshPolicy;
}

/** Client credentials: the client trades its own id and secret for a short-lived token, cached until it expires. */
interface OAuth2ClientCredentialsAuth {
  readonly type: typeof AuthType.OAuth2ClientCredentials;
  /** The token endpoint. */
  readonly tokenUrl: string;
  /** The client id, usually `"{clientId}"`. */
  readonly clientId: string;
  /** The client secret, usually `"{clientSecret}"`. */
  readonly clientSecret: string;
  /** The OAuth scopes requested with each token. */
  readonly scopes?: readonly string[];
  /** How the client authenticates at the token endpoint; `"basic"` when left out. */
  readonly clientAuthentication?: ClientAuthentication;
  /** When the cached token is renewed. */
  readonly refresh?: RefreshPolicy;
}

/** A static key, in exactly one of a header or a query parameter. */
interface ApiKeyAuth {
  readonly type: typeof AuthType.ApiKey;
  /** The header that carries the key (`Authorization`). */
  readonly header?: string;
  /** The query parameter that carries the key, for a provider without a header. */
  readonly query?: string;
  /** The value written, with its placeholders; `"{apiKey}"` when left out (`"Bearer {apiKey}"`). */
  readonly format?: string;
}

/** HTTP Basic (RFC 7617). */
interface BasicAuth {
  readonly type: typeof AuthType.Basic;
  /** The user name, usually a placeholder (`"{accountSid}"`). */
  readonly username: string;
  /** The password, usually a placeholder (`"{authToken}"`). */
  readonly password: string;
}

/** A JWT signed for each call and sent as a bearer token. */
interface JwtAuth {
  readonly type: typeof AuthType.Jwt;
  /** The signing algorithm: an HMAC secret, an RSA or a P-256 private key. */
  readonly algorithm: "HS256" | "RS256" | "ES256";
  /** The signing key, usually `"{privateKey}"`: the secret for HS256, a PKCS #8 PEM private key otherwise. */
  readonly key: string;
  /** The `kid` header. */
  readonly keyId?: string;
  /** The `iss` claim. */
  readonly issuer?: string;
  /** The `sub` claim. */
  readonly subject?: string;
  /** The `aud` claim. */
  readonly audience?: string;
  /** How long a token lives; `"5m"` when left out. */
  readonly expiresIn?: Interval;
  /** The header the token is sent in, as `Bearer <jwt>`; `Authorization` when left out. */
  readonly header?: string;
}

/** No credentials. */
interface NoAuth {
  readonly type: typeof AuthType.None;
}

/**
 * The `auth` option of an Integration.
 *
 * @example
 * const auth: AuthOptions = { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" };
 */
export type AuthOptions =
  | OAuth2CodeAuth
  | OAuth2ClientCredentialsAuth
  | ApiKeyAuth
  | BasicAuth
  | JwtAuth
  | NoAuth;
