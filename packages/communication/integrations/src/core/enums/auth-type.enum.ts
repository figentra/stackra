/**
 * Stackra file contract:
 * Purpose: `AuthType`, the six ways a provider authenticates a call, the discriminant of an Integration's `auth`
 *          option (`auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" }`).
 * Boundary: an `Enum.of` value plus the type of the same name. Exactly six members: a new one is added only with a
 *           provider that needs it, as a new member of the `auth` union, and there is no `custom` hook; a provider
 *           outside the six is a driver that signs its own requests (ADR 0308 rule 8).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 6 to 8); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * How a provider authenticates the managed client's calls.
 *
 * @example
 * auth: { type: AuthType.OAuth2Code, authorizeUrl, tokenUrl, clientId: "{clientId}", scopes: ["calendar.read"] }
 */
export const AuthType = Enum.of({
  /** Authorization code with PKCE: a user grants access and the connection holds the tokens, refreshed on use. */
  OAuth2Code: "oauth2_code",
  /** Client credentials: the client exchanges its own id and secret for a short-lived token. */
  OAuth2ClientCredentials: "oauth2_client_credentials",
  /** A static key, sent in a header or a query parameter. */
  ApiKey: "api_key",
  /** HTTP Basic with a user name and a password. */
  Basic: "basic",
  /** A JSON Web Token the client signs with a private key for each call. */
  Jwt: "jwt",
  /** No credentials: a public API, or a platform-only webhook. */
  None: "none",
});

/** One of the six codes above. */
export type AuthType = Enum.Value<typeof AuthType>;
