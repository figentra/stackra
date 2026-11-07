/**
 * Stackra file contract:
 * Purpose: `CallAuthenticator`, the authentication of one inbound API call: the `Authorization: Bearer` token verified
 *          by `verifyBearerToken` under `BearerConfig` and the bound `JsonWebKeys`, then mapped to its `Actor` by
 *          @stackra/identity's `actorOf`: a user, or the service whose ZITADEL service account signed it (ADR 0209
 *          decision 3). It is the one place that reads `Authorization` and `Stackra-On-Behalf-Of`: the generated Encore
 *          `authHandler` (typed endpoints) and the raw-endpoint helper (STA-2577, after its guards) both call it, and
 *          the forwarded user token (`onBehalfOf`, the next step of STA-2558) is verified here only.
 * Boundary: built per call over the call's container, like `ActionPipeline`, so no host binds it. `ServicePrincipals`
 *           is resolved only when the host binds a driver; with none, every service token is refused (401, never a
 *           500) and user tokens still pass. Every failure is one `BearerTokenInvalidError` (`unauthenticated`) with no
 *           detail: no or a non-bearer header, a bad signature, expiry, issuer or audience, an unknown service subject,
 *           malformed claims, and any `Stackra-On-Behalf-Of` header until the forwarded token is verified. Never
 *           Anonymous. An issuer or principal store that cannot be reached throws its own error (an outage, not a bad
 *           token). The token is never logged or put in an error.
 * Runtime: node
 * Governing contract: ADR 0209 (decision 3 and its 2026-11-07 amendment, point 5: one auth handler); ADR 0206
 *                     (decision 8: tokens verified by JWKS); ADR 0098 (the actor from the credential).
 */
import type { Container } from "@stackra/container";
import { isRefusal, UnauthenticatedError } from "@stackra/errors";
import { actorOf, MemoryServicePrincipalsDriver } from "@stackra/identity";
import { ServicePrincipals } from "@stackra/identity/contracts";

import { BearerConfig } from "#config/bearer.config";
import { JsonWebKeys } from "#contracts/ports/json-web-keys.port";
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
 *   app.handlers.run((container) => new CallAuthenticator(container).authenticate(params)),
 * );
 */
// oxlint-disable-next-line stackra/base-matches-suffix -- reason: built per call over the call's container, like ActionPipeline, never a container service
export class CallAuthenticator {
  /** The call's container. */
  private readonly container: Pick<Container, "get" | "has">;

  /**
   * @param container - the call's request container.
   */
  constructor(container: Pick<Container, "get" | "has">) {
    this.container = container;
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
    const config = this.container.get(BearerConfig);
    const keys = this.container.get(JsonWebKeys);
    const claims = await verifyBearerToken(token, {
      issuer: config.issuer,
      audience: config.audience,
      leewaySeconds: config.leewaySeconds,
      now: new Date(),
      keys: (kid) => keys.find(kid),
    });
    if (claims === undefined) throw BearerTokenInvalidError.create();
    // No bound driver knows no service: an empty store refuses every service token.
    const principals = this.container.has(ServicePrincipals)
      ? this.container.get(ServicePrincipals)
      : new MemoryServicePrincipalsDriver();
    try {
      const actor = await actorOf(claims, principals);
      return { userID: actor.id, actor };
    } catch (error) {
      if (isRefusal(error, UnauthenticatedError)) throw BearerTokenInvalidError.create();
      throw error;
    }
  }
}
