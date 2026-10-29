/**
 * Stackra file contract:
 * Purpose: the `JsonWebKeys` port: the public key of a `kid` from the identity provider's key set (JWKS), so the
 *          bearer-token guard verifies a ZITADEL access token without a library.
 * Boundary: an abstract class that is its own token, keyed `app.JsonWebKeys`. Which source answers is configuration:
 *           the shipped `oidc` driver (the issuer's discovery document and key set, cached) or the `memory` driver of
 *           tests. An unknown `kid` answers null; a provider that cannot be reached throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8: tokens verified by JWKS); ADR 0294 (decisions 4 and 16); RFC 7517.
 */
import { Port } from "@stackra/contracts";

/**
 * The identity provider's public signing keys.
 *
 * @example
 * const jwk = await keys.find(header.kid);
 */
export abstract class JsonWebKeys extends Port {
  /** Type-only port key, so `DriverName<JsonWebKeys>` narrows to this port's drivers. */
  declare readonly "~key": "app.JsonWebKeys";

  /** The public key whose `kid` is `kid`, or null when the key set has none. */
  abstract find(kid: string): Promise<JsonWebKey | null>;
}
