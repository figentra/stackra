/**
 * Stackra file contract:
 * Purpose: `CallAuthenticator`, the authentication of one inbound API call: the `Authorization: Bearer` token verified
 *          by `verifyBearerToken` under `BearerConfig` and the bound `JsonWebKeys`, then mapped to its `Actor` by
 *          @stackra/identity's `actorOf`: a user, or the service whose ZITADEL service account signed it (ADR 0209
 *          decision 3). A service that calls for a user also forwards the user's own access token in
 *          `Stackra-On-Behalf-Of`; the call is then that service with `onBehalfOf` the user (ADR 0209, amendment of
 *          2026-11-07). A bearer that is an API key (its kind's prefix, `stackra_sk_…`, `stackra_pk_…`) is verified by
 *          @stackra/identity's `ApiKeyVerifierService` instead: the call runs as the key's principal (`api_client`)
 *          with the key's call options (credential, origin, sandbox for a test key). It is the one place that reads
 *          `Authorization` and `Stackra-On-Behalf-Of`: the generated Encore `authHandler` (typed endpoints) and the
 *          raw-endpoint helper (STA-2577, after its guards) both call it.
 * Boundary: built per call over the call's container, like `ActionPipeline`, so no host binds it. `ServicePrincipals`
 *           is resolved only when the host binds a driver; with none, every service token is refused (401, never a
 *           500) and user tokens still pass. The forwarded token is verified like the bearer (same issuer, audience
 *           and leeway, never extended or refreshed), counts only beside a service bearer, must map to a user; whether a
 *           tenant-bound service may call for that user is `CallIsolationDriver`'s check through the scope tree. Only
 *           the derived user actor travels, never the token. Every failure is one `BearerTokenInvalidError` (`unauthenticated`) with
 *           no detail: no or a non-bearer header, a bad signature, expiry, issuer or audience on either token, an
 *           unknown service subject, malformed claims, a forward beside a user bearer, or a forwarded service token;
 *           for a key, any refusal of the verifier, a forwarded token beside a key (a key never acts for a user), or no
 *           bound `ApiKeyVerifierService` (every key refused). Never Anonymous. An issuer, principal or key store that
 *           cannot be reached throws
 *           its own error (an outage, not a bad token). No token is ever logged or put in an error.
 * Runtime: node
 * Governing contract: ADR 0209 (decision 3 and its 2026-11-07 amendment, point 5: one auth handler); ADR 0206
 *                     (decision 8: tokens verified by JWKS); ADR 0098 (the actor from the credential); ADR 0278 (as
 *                     amended: the gateway path, STA-2646 B3).
 */
import { CallOriginKind } from "@stackra/actions/contracts";
import type { Container } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { isRefusal, UnauthenticatedError } from "@stackra/errors";
import {
  actorOf,
  ApiKeyKind,
  ApiKeyRejectedError,
  ApiKeyVerifierService,
  IdentityConfig,
  MemoryServicePrincipalsDriver,
  parseApiKey,
} from "@stackra/identity";
import { ApiKeyMode, ServicePrincipals } from "@stackra/identity/contracts";

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
 * // the generated stackra-encore/<member>/auth.ts
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
   * The verified caller of a call that presented `credentials`: the bearer's actor or, for a service bearer with a
   * forwarded user token, that service acting for the user; for an API key, its principal with the key's call options.
   *
   * @throws BearerTokenInvalidError when the call is not authenticated, for any reason.
   */
  async authenticate(credentials: CallCredentials): Promise<CallAuthData> {
    const bearer = BEARER.exec(credentials.authorization?.trim() ?? "")?.[1];
    if (bearer === undefined) throw BearerTokenInvalidError.create();
    if (this.isApiKey(bearer)) return this.keyCall(bearer, credentials);
    const caller = await this.actorOfToken(bearer);
    if (credentials.onBehalfOf === undefined) return { userID: caller.id, actor: caller };
    // A forwarded user token counts only beside a valid service token, and maps to a user only (ADR 0209, amendment of
    // 2026-11-07, conditions 1 and 2: same issuer, audience and leeway, never extended or refreshed).
    if (caller.kind !== ActorKind.Service) throw BearerTokenInvalidError.create();
    const user = await this.actorOfToken(credentials.onBehalfOf.trim());
    if (user.kind !== ActorKind.User) throw BearerTokenInvalidError.create();
    // Condition 3 (a service bound to a tenant calls only for a user of that tenant) needs the scope tree, where a
    // branch stands for its tenant: CallIsolationDriver owns it.
    // Only the derived user travels, never the forwarded token (condition 4).
    return { userID: caller.id, actor: { ...caller, onBehalfOf: user } };
  }

  /** Whether `bearer` is an API key by its kind's prefix; with no bound verifier nothing is, so a key fails as a token. */
  private isApiKey(bearer: string): boolean {
    return (
      this.container.has(ApiKeyVerifierService) &&
      parseApiKey(bearer, this.container.get(IdentityConfig)) !== undefined
    );
  }

  /**
   * The call of a verified API key: its principal as an `api_client` actor in its tenant, with the key as the call's
   * credential and origin, in the sandbox for a test key.
   *
   * @throws BearerTokenInvalidError when the key is refused or a user token is forwarded beside it.
   */
  private async keyCall(key: string, credentials: CallCredentials): Promise<CallAuthData> {
    // a key is its own caller and never acts for a user, so a forwarded token beside it is refused (STA-2646 G5)
    if (credentials.onBehalfOf !== undefined) throw BearerTokenInvalidError.create();
    const verified = await this.container
      .get(ApiKeyVerifierService)
      .verify(key, credentials.origin ?? null)
      .catch((error: unknown) => {
        // the verifier's one refusal is a bad credential; a store outage stays an outage
        if (isRefusal(error, ApiKeyRejectedError)) throw BearerTokenInvalidError.create();
        throw error;
      });
    const { record } = verified;
    const actor: Actor = {
      kind: ActorKind.ApiClient,
      id: record.principal,
      ...(record.scopeId === undefined ? {} : { scopeId: record.scopeId }),
    };
    return {
      userID: actor.id,
      actor,
      call: {
        credential: {
          kind: "api_key",
          id: record.id,
          scopes: record.scopes,
          publishable: verified.kind === ApiKeyKind.Publishable,
          ...(record.versionPin === undefined ? {} : { versionPin: record.versionPin }),
        },
        origin: { kind: CallOriginKind.ApiKey, id: record.id },
        sandbox: verified.mode === ApiKeyMode.Test,
      },
    };
  }

  /**
   * The actor of a verified access token.
   *
   * @throws BearerTokenInvalidError when the token does not verify or maps to no actor.
   */
  private async actorOfToken(token: string): Promise<Actor> {
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
      return await actorOf(claims, principals);
    } catch (error) {
      if (isRefusal(error, UnauthenticatedError)) throw BearerTokenInvalidError.create();
      throw error;
    }
  }
}
