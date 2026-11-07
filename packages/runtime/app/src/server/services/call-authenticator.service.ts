/**
 * Stackra file contract:
 * Purpose: `CallAuthenticator`, the authentication of one inbound API call for the generated Encore auth handler:
 *          the `Authorization: Bearer` token verified by `verifyBearerToken` under `BearerConfig` and the bound
 *          `JsonWebKeys`, then mapped to its `Actor` by @stackra/identity's `actorOf`: a user, or the service whose
 *          ZITADEL service account signed it (ADR 0209 decision 3).
 * Boundary: every failure is one `BearerTokenInvalidError` (`unauthenticated`) with no detail: no or a non-bearer
 *           header, a bad signature, expiry, issuer or audience, an unknown service subject, malformed claims, and any
 *           `Stackra-On-Behalf-Of` header until the forwarded user token is verified (the next step of STA-2558). Never
 *           Anonymous. An issuer or principal store that cannot be reached throws its own error (an outage, not a bad
 *           token). The token is never logged or put in an error.
 * Runtime: node
 * Governing contract: ADR 0209 (decision 3 and its 2026-11-07 amendment, point 5: one auth handler); ADR 0206
 *                     (decision 8: tokens verified by JWKS); ADR 0098 (the actor from the credential).
 */
import { Service } from "@stackra/container";
import { isRefusal, UnauthenticatedError } from "@stackra/errors";
import { actorOf } from "@stackra/identity";
import type { ServicePrincipals } from "@stackra/identity/contracts";

import type { BearerConfig } from "#config/bearer.config";
import type { JsonWebKeys } from "#contracts/ports/json-web-keys.port";
import { verifyBearerToken } from "#core/functions/verify-bearer-token.function";
import { BearerTokenInvalidError } from "#server/errors/bearer-token-invalid.error";
import type { CallAuthData } from "#server/types/call-auth-data.type";
import type { CallCredentials } from "#server/types/call-credentials.type";

/** `Bearer <token>`, any case of the scheme (RFC 7235). */
const BEARER = /^bearer +(\S+)$/i;

/**
 * Authenticates inbound calls.
 *
 * @example
 * // the generated .stackra/encore/<member>/auth.ts
 * authHandler<AuthParams, CallAuthData>((params) =>
 *   app.handlers.run((container) => container.get(CallAuthenticator).authenticate(params)),
 * );
 */
export class CallAuthenticator extends Service {
  /** The issuer, audience and leeway. */
  private readonly config: BearerConfig;

  /** The issuer's public keys. */
  private readonly keys: JsonWebKeys;

  /** The service principals by token subject. */
  private readonly principals: ServicePrincipals;

  /**
   * @param config - the bearer-token settings.
   * @param keys - the bound key source.
   * @param principals - the bound service principals.
   */
  constructor(config: BearerConfig, keys: JsonWebKeys, principals: ServicePrincipals) {
    super();
    this.config = config;
    this.keys = keys;
    this.principals = principals;
  }

  /**
   * The verified caller of a call that presented `credentials`.
   *
   * @throws BearerTokenInvalidError when the call is not authenticated, for any reason.
   */
  async authenticate(credentials: CallCredentials): Promise<CallAuthData> {
    // The forwarded user token (onBehalfOf) is verified in the next step; until then it is refused, never ignored.
    if (credentials.onBehalfOf !== undefined) throw BearerTokenInvalidError.create();
    const token = BEARER.exec(credentials.authorization?.trim() ?? "")?.[1];
    if (token === undefined) throw BearerTokenInvalidError.create();
    const claims = await verifyBearerToken(token, {
      issuer: this.config.issuer,
      audience: this.config.audience,
      leewaySeconds: this.config.leewaySeconds,
      now: new Date(),
      keys: (kid) => this.keys.find(kid),
    });
    if (claims === undefined) throw BearerTokenInvalidError.create();
    try {
      const actor = await actorOf(claims, this.principals);
      return { userID: actor.id, actor };
    } catch (error) {
      if (isRefusal(error, UnauthenticatedError)) throw BearerTokenInvalidError.create();
      throw error;
    }
  }
}
