/**
 * Stackra file contract:
 * Purpose: `OidcJsonWebKeysDriver` (`oidc`), the `JsonWebKeys` driver that reads `BearerConfig.issuer`'s discovery
 *          document and key set over HTTPS, cached in memory for `BearerConfig.keysSeconds` and refetched once when a
 *          `kid` is unknown (`jwksKeySource`, shared with the edge Worker).
 * Boundary: one cache per driver instance (a singleton, so one per process). The issuer is configuration; an issuer
 *           that cannot be reached throws, which the server answers as a failure, never as a bad token.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8: tokens verified by JWKS); ADR 0294 (decisions 4 and 16).
 */
import { Driver } from "@stackra/container";

import type { BearerConfig } from "#config/bearer.config";
import { JsonWebKeys } from "#contracts/ports/json-web-keys.port";
import { jwksKeySource } from "#core/functions/jwks-key-source.function";

/**
 * The issuer's keys over OIDC discovery.
 *
 * @example
 * const jwk = await new OidcJsonWebKeysDriver(config).find("kid-1");
 */
export class OidcJsonWebKeysDriver extends Driver(JsonWebKeys) {
  /** The cached key lookup. */
  private readonly source: JsonWebKeys["find"];

  /**
   * @param config - the issuer and the key-set cache time.
   */
  constructor(config: BearerConfig) {
    super();
    this.source = jwksKeySource(config.issuer, config.keysSeconds);
  }

  /** The public key of `kid`, or null. */
  find(kid: string): Promise<JsonWebKey | null> {
    return this.source(kid);
  }
}
