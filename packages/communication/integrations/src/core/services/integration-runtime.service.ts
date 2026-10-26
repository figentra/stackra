/**
 * Stackra file contract:
 * Purpose: `IntegrationRuntime`, the platform service every Integration is built with (gen wires it as the one
 *          constructor dependency of an integration binding): it makes the managed clients, keeps each credential's
 *          OAuth tokens in memory and renews them single-flight (a refresh, a client credentials grant or a signed JWT
 *          bearer assertion), and revokes them at disconnect.
 * Boundary: a service with three dependencies: the `SecretStore` (the Integration's `@Secret` fields, read blind by
 *           name at call time), the `RateLimitStore` of `@stackra/actions` (the providers' buckets) and the `Clock`.
 *           Tokens are kept per `<integration>:<connection id | platform>`, never logged; an access token is renewed
 *           `refresh.buffer` before it expires, by one call however many requests wait for it. An `OAuth2Code`
 *           integration calls only through a connection.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 3, 4, 6, 7, 12, 13 and 20); ADR 0173 (secrets); ADR 0294 (decision 17).
 */
import type { RateLimitStore } from "@stackra/actions/contracts";
import type { SecretStore } from "@stackra/config/contracts";
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";

import type { Connection } from "#core/bases/connection.base";
import type { Integration } from "#core/bases/integration.base";
import { AuthType } from "#core/enums/auth-type.enum";
import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import { ProviderUnavailableError } from "#core/errors/provider-unavailable.error";
import { integrationOptionsOf } from "#core/functions/integration-options-of.function";
import { intervalMs } from "#core/functions/interval-ms.function";
import { managedClient } from "#core/functions/managed-client.function";
import { placeholderLookup } from "#core/functions/placeholder-lookup.function";
import { requestToken } from "#core/functions/request-token.function";
import { resolvePlaceholders } from "#core/functions/resolve-placeholders.function";
import { signJwt } from "#core/functions/sign-jwt.function";
import { tokenEndpointInit } from "#core/functions/token-endpoint-init.function";
import type { IntegrationApi } from "#core/types/integration-api.type";
import type { IntegrationClass } from "#core/types/integration-class.type";
import type { OAuthTokens } from "#core/types/oauth-tokens.type";

/** The `auth` options of the three OAuth types. */
type OAuthOptions = Extract<
  ReturnType<typeof integrationOptionsOf>["auth"],
  {
    readonly type:
      | typeof AuthType.OAuth2Code
      | typeof AuthType.OAuth2ClientCredentials
      | typeof AuthType.OAuth2JwtBearer;
  }
>;

/** The grant type of a JWT bearer assertion (RFC 7523 section 2.1). */
const JWT_BEARER_GRANT = "urn:ietf:params:oauth:grant-type:jwt-bearer";

/**
 * Makes managed clients and holds their tokens.
 *
 * @example
 * const api = runtime.client(resend, connection); // the connection's credentials, the platform's as fallback
 */
export class IntegrationRuntime extends Service {
  /** Resolves `@Secret` fields by name. */
  private readonly secrets: SecretStore;

  /** Holds the providers' rate-limit buckets. */
  private readonly limits: RateLimitStore;

  /** Tells the time. */
  private readonly clock: Clock;

  /** One instance per Integration class, for the stores. */
  private readonly instances = new Map<IntegrationClass, Integration>();

  /** The latest tokens of each credential, settled or being renewed. */
  private readonly tokens = new Map<string, Promise<OAuthTokens>>();

  /**
   * @param secrets - the secret store.
   * @param limits - the rate-limit store.
   * @param clock - the clock.
   */
  constructor(secrets: SecretStore, limits: RateLimitStore, clock: Clock) {
    super();
    this.secrets = secrets;
    this.limits = limits;
    this.clock = clock;
  }

  /**
   * The managed client of `integration`, with `connection`'s credentials (the Integration's as fallback) or the
   * Integration's own.
   *
   * @param tokens - an `OAuth2Code` connection's stored tokens, or a source of fresh access tokens (the store host's).
   */
  client(
    integration: Integration,
    connection?: Connection,
    tokens?: OAuthTokens | (() => Promise<string>),
  ): IntegrationApi {
    const { auth } = integrationOptionsOf(integration.constructor);
    let accessToken: (() => Promise<string>) | undefined;
    if (typeof tokens === "function") accessToken = tokens;
    else if (
      auth.type === AuthType.OAuth2ClientCredentials ||
      auth.type === AuthType.OAuth2JwtBearer ||
      (auth.type === AuthType.OAuth2Code && connection !== undefined)
    ) {
      const key = this.keyOf(integration, connection);
      if (tokens !== undefined && !this.tokens.has(key))
        this.tokens.set(key, Promise.resolve(tokens));
      accessToken = async () => (await this.fresh(integration, auth, connection)).accessToken;
    }
    return managedClient({
      integration,
      secrets: this.secrets,
      limits: this.limits,
      clock: this.clock,
      ...(connection === undefined ? {} : { connection }),
      ...(accessToken === undefined ? {} : { accessToken }),
    });
  }

  /** The one instance of `type` this runtime builds, which a store reads the platform's fallback values from. */
  integration<I extends Integration>(type: IntegrationClass<I>): I {
    const known = this.instances.get(type);
    if (known !== undefined) return known as I;
    const built = Reflect.construct(type, [this]) as I;
    this.instances.set(type, built);
    return built;
  }

  /**
   * Revokes `connection`'s tokens at the Integration's revocation endpoint, when it declares one, and forgets them.
   * A provider that refuses the token (already revoked or expired) counts as revoked.
   *
   * @throws ProviderUnavailableError when the endpoint does not answer or fails; the tokens are kept for a retry.
   */
  async revoke(integration: Integration, connection: Connection): Promise<void> {
    const { auth, provider } = integrationOptionsOf(integration.constructor);
    const key = this.keyOf(integration, connection);
    const known = this.tokens.get(key);
    const tokens = known === undefined ? undefined : await known.catch(() => undefined);
    if (auth.type === AuthType.OAuth2Code && auth.revokeUrl !== undefined && tokens !== undefined) {
      const resolve = this.resolverOf(integration, connection);
      const token = tokens.refreshToken ?? tokens.accessToken;
      const form = {
        token,
        token_type_hint: tokens.refreshToken === undefined ? "access_token" : "refresh_token",
      };
      const clientSecret = auth.clientSecret === undefined ? undefined : resolve(auth.clientSecret);
      let response: Response;
      try {
        response = await fetch(
          auth.revokeUrl,
          tokenEndpointInit(
            form,
            resolve(auth.clientId),
            clientSecret,
            auth.clientAuthentication ?? "basic",
          ),
        );
      } catch (error) {
        throw ProviderUnavailableError.create({ provider }, { cause: error });
      }
      if (response.status === 408 || response.status === 429 || response.status >= 500)
        throw ProviderUnavailableError.create({ provider, status: response.status });
    }
    this.tokens.delete(key);
  }

  /** The credential key tokens are kept under. */
  private keyOf(integration: Integration, connection: Connection | undefined): string {
    return `${integration.constructor.name}:${connection === undefined ? "platform" : connection.id}`;
  }

  /** Fills placeholders for this credential set. */
  private resolverOf(
    integration: Integration,
    connection: Connection | undefined,
  ): (template: string) => string {
    const lookup = placeholderLookup(integration, connection, this.secrets);
    return (template) => resolvePlaceholders(template, lookup);
  }

  /** The credential's tokens, renewed by one call when they expire within the refresh buffer. */
  private async fresh(
    integration: Integration,
    auth: OAuthOptions,
    connection: Connection | undefined,
  ): Promise<OAuthTokens> {
    const key = this.keyOf(integration, connection);
    const known = this.tokens.get(key);
    const current = known === undefined ? undefined : await known.catch(() => undefined);
    const buffer = intervalMs(auth.refresh?.buffer ?? "60s");
    if (
      current !== undefined &&
      (current.expiresAt === undefined ||
        current.expiresAt.getTime() - buffer > this.clock.now().getTime())
    )
      return current;
    const latest = this.tokens.get(key);
    if (latest !== undefined && latest !== known) return latest; // another call is renewing them
    const next = this.renew(integration, auth, connection, current);
    this.tokens.set(key, next);
    try {
      return await next;
    } catch (error) {
      if (this.tokens.get(key) === next) {
        if (known === undefined) this.tokens.delete(key);
        else this.tokens.set(key, known);
      }
      throw error;
    }
  }

  /**
   * One call to the token endpoint: a signed JWT bearer assertion, a client credentials grant, or a refresh that keeps
   * an unrotated refresh token.
   */
  private async renew(
    integration: Integration,
    auth: OAuthOptions,
    connection: Connection | undefined,
    current: OAuthTokens | undefined,
  ): Promise<OAuthTokens> {
    const { provider } = integrationOptionsOf(integration.constructor);
    const resolve = this.resolverOf(integration, connection);
    if (auth.type === AuthType.OAuth2JwtBearer) {
      const now = this.clock.now();
      const assertion = await signJwt(
        {
          algorithm: auth.algorithm ?? "RS256",
          key: auth.key,
          issuer: auth.issuer,
          audience: auth.audience ?? auth.tokenUrl,
          expiresIn: auth.expiresIn ?? "1h",
          ...(auth.keyId === undefined ? {} : { keyId: auth.keyId }),
          ...(auth.subject === undefined ? {} : { subject: auth.subject }),
        },
        resolve,
        now,
        auth.scopes === undefined ? {} : { scope: auth.scopes.join(" ") },
      );
      return requestToken({
        url: auth.tokenUrl,
        form: { grant_type: JWT_BEARER_GRANT, assertion },
        provider,
        now,
      });
    }
    const client = {
      url: auth.tokenUrl,
      clientId: resolve(auth.clientId),
      clientSecret: auth.clientSecret === undefined ? undefined : resolve(auth.clientSecret),
      authentication: auth.clientAuthentication ?? "basic",
      provider,
      now: this.clock.now(),
    } as const;
    if (auth.type === AuthType.OAuth2ClientCredentials)
      return requestToken({
        ...client,
        form: {
          grant_type: "client_credentials",
          ...(auth.scopes === undefined ? {} : { scope: auth.scopes.join(" ") }),
        },
      });
    const refreshToken = current?.refreshToken;
    // No refresh token left: the user must grant access again, as OAuth reports an invalid grant.
    if (refreshToken === undefined)
      throw ProviderRefusedError.create({ provider, status: 401, code: "invalid_grant" });
    const renewed = await requestToken({
      ...client,
      form: { grant_type: "refresh_token", refresh_token: refreshToken },
    });
    return renewed.refreshToken === undefined ? { ...renewed, refreshToken } : renewed;
  }
}
