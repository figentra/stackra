/**
 * Stackra file contract:
 * Purpose: `BearerTokenGuard`, the authentication check of ADR 0437's server-check order for an API that runs without
 *          the OS edge Worker: a `RequestGuard` that lets a request through only with an `Authorization: Bearer` JWT
 *          that `verifyBearerToken` accepts under `BearerConfig` (issuer, audience, leeway) and the bound `JsonWebKeys`,
 *          and puts the verified claims on the request's `VerifiedToken` for the checks after it.
 * Boundary: `Lifetime.Request`, so it writes the `VerifiedToken` of its own request. A request with no bearer token
 *           reaches only a public path. Every failure is one `BearerTokenInvalidError`; an issuer that cannot be
 *           reached throws its own error (an outage, not a bad token). The public paths are a getter a host overrides
 *           (ADR 0306); everything else is configuration. Membership, roles and the scope are later checks, not this.
 * Runtime: node
 * Governing contract: ADR 0206 (decision 8: tokens verified by JWKS); ADR 0437 (decision 8: authentication after the
 *                     edge headers, origin, CSRF and rate limits); ADR 0457 (RequestGuard); ADR 0306 (overrides).
 */
import { Lifetime } from "@stackra/container";

import type { BearerConfig } from "#config/bearer.config";
import type { JsonWebKeys } from "#contracts/ports/json-web-keys.port";
import { verifyBearerToken } from "#core/functions/verify-bearer-token.function";
import { RequestGuard } from "#server/bases/request-guard.base";
import { BearerTokenInvalidError } from "#server/errors/bearer-token-invalid.error";
import type { VerifiedToken } from "#server/services/verified-token.service";

/** `Bearer <token>`, any case of the scheme (RFC 7235). */
const BEARER = /^bearer +(\S+)$/i;

/**
 * Verifies the bearer token of every inbound request.
 *
 * @example
 * // a host override, src/overrides/app/bearer-token.guard.ts
 * export class BearerTokenGuard extends BaseBearerTokenGuard {
 *   override get publicPaths() { return ["/healthz", "/public/"]; }
 * }
 */
@Lifetime(Lifetime.Request)
export class BearerTokenGuard extends RequestGuard {
  /** The issuer, audience and leeway. */
  private readonly config: BearerConfig;

  /** The issuer's public keys. */
  private readonly keys: JsonWebKeys;

  /** Where the verified claims go. */
  private readonly verified: VerifiedToken;

  /**
   * @param config - the bearer-token settings.
   * @param keys - the bound key source.
   * @param verified - the request's verified-token holder.
   */
  constructor(config: BearerConfig, keys: JsonWebKeys, verified: VerifiedToken) {
    super();
    this.config = config;
    this.keys = keys;
    this.verified = verified;
  }

  /** After the edge headers, origin, CSRF and rate limits; before tenant state and IAM. */
  override get order(): number {
    return -50;
  }

  /** Path prefixes that answer a request with no bearer token; none by default. */
  get publicPaths(): readonly string[] {
    return [];
  }

  /**
   * Lets `request` through when its bearer token verifies, and records the claims.
   *
   * @throws BearerTokenInvalidError when the token is missing (off a public path) or invalid.
   */
  async check(request: Request): Promise<void> {
    const header = request.headers.get("authorization");
    if (header === null) {
      const { pathname } = new URL(request.url);
      if (this.publicPaths.some((prefix) => pathname.startsWith(prefix))) return;
      throw BearerTokenInvalidError.create();
    }
    const token = BEARER.exec(header.trim())?.[1];
    if (token === undefined) throw BearerTokenInvalidError.create();
    const claims = await verifyBearerToken(token, {
      issuer: this.config.issuer,
      audience: this.config.audience,
      leewaySeconds: this.config.leewaySeconds,
      now: new Date(),
      keys: (kid) => this.keys.find(kid),
    });
    if (claims === undefined) throw BearerTokenInvalidError.create();
    this.verified.claims = claims;
  }
}
