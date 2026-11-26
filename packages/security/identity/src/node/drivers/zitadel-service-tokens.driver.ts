/**
 * Stackra file contract:
 * Purpose: `ZitadelServiceTokensDriver` (`zitadel`), the `ServiceTokens` driver that signs in as this service's own
 *          ZITADEL service account with the JWT profile (RFC 7523): it reads the account's key file (JSON: `keyId`, `key`,
 *          `userId`) from the secret store by the name `ServiceTokensConfig.keySecret` gives, signs a short RS256
 *          assertion (`iss` and `sub` the service user, `aud` the issuer), and POSTs it to the issuer's token endpoint
 *          (`<issuer>/oauth/v2/token`, grant `urn:ietf:params:oauth:grant-type:jwt-bearer`) with the scope
 *          `openid urn:zitadel:iam:org:project:id:<audience>:aud`. Each audience's token is kept until `skewSeconds`
 *          before it expires, and callers asking at once share one request.
 * Boundary: a singleton, so one cache per process; nothing is written anywhere else. The key, the assertion and every
 *           token stay in this instance: never logged, never put in an error, its cause or an event. A missing or
 *           unreadable key, or no issuer, throws an `Error` naming the setting, never a value. A 429, a 5xx, a timeout or
 *           a network failure is `ServiceTokenUnavailableError` (an outage, retryable); any other refusal, or an answer
 *           that is not a token, is `ServiceTokenRefusedError`. An audience must be a project id, so nothing can be added
 *           to the scope. The service user's token type must be JWT in ZITADEL, as the receiver verifies by JWKS.
 * Runtime: node
 * Governing contract: ADR 0209 (decision 3 and its 2026-11-07 amendment, point 1); ADR 0173 (secrets are names); RFC
 *                     7523; STA-2558.
 */
import { createPrivateKey, createSign } from "node:crypto";

import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";

import type { ServiceTokensConfig } from "#config/service-tokens.config";
import { ServiceTokens } from "#contracts/index";
import { ServiceTokenRefusedError } from "#core/errors/service-token-refused.error";
import { ServiceTokenUnavailableError } from "#core/errors/service-token-unavailable.error";

/** The OAuth grant type of a JWT-profile token request (RFC 7523). */
const JWT_BEARER = "urn:ietf:params:oauth:grant-type:jwt-bearer";

/** How long a signed assertion is valid, in seconds: only for the one request it is made for. */
const ASSERTION_SECONDS = 60;

/** A ZITADEL project id, the only audience the scope may name. */
const PROJECT_ID = /^[A-Za-z0-9_-]+$/;

/** The fields of a ZITADEL service account key file this driver reads. */
interface KeyFile {
  readonly keyId: string;
  readonly key: string;
  readonly userId: string;
}

/** A token and when it stops being reused, in epoch milliseconds. */
interface Held {
  readonly token: string;
  readonly renewAt: number;
}

/** Base64url of `value`. */
const b64url = (value: string | Buffer): string => Buffer.from(value).toString("base64url");

/**
 * This service's tokens from ZITADEL.
 *
 * @example
 * const token = await serviceTokens.for("312909075212468632"); // Pay's project id
 */
export class ZitadelServiceTokensDriver extends Driver(ServiceTokens) {
  /** The issuer, the key's secret name, the skew and the timeout. */
  private readonly config: ServiceTokensConfig;

  /** Where the key file is read, by name. */
  private readonly secrets: SecretStore;

  /** The time tokens expire against. */
  private readonly clock: Clock;

  /** Audience to its token. */
  private readonly held = new Map<string, Held>();

  /** Audience to the request already under way for it. */
  private readonly pending = new Map<string, Promise<string>>();

  /**
   * @param config - the service token settings.
   * @param secrets - the secret store the key file is read from.
   * @param clock - the clock expiry is measured against.
   */
  constructor(config: ServiceTokensConfig, secrets: SecretStore, clock: Clock) {
    super();
    this.config = config;
    this.secrets = secrets;
    this.clock = clock;
  }

  /**
   * Implements `ServiceTokens.for`, documented there.
   *
   * @throws TypeError when `audience` is not a project id.
   * @throws ServiceTokenUnavailableError when the issuer cannot be reached or fails on its side.
   * @throws ServiceTokenRefusedError when the issuer refuses the key or answers no token.
   */
  for(audience: string): Promise<string> {
    if (!PROJECT_ID.test(audience))
      return Promise.reject(
        new TypeError(`a service token audience is a project id, got ${audience}`),
      );
    const kept = this.held.get(audience);
    if (kept !== undefined && kept.renewAt > this.clock.now().getTime())
      return Promise.resolve(kept.token);
    let request = this.pending.get(audience);
    if (request === undefined) {
      request = this.request(audience).finally(() => this.pending.delete(audience));
      this.pending.set(audience, request);
    }
    return request;
  }

  /** Asks the issuer for a token for `audience` and keeps it. */
  private async request(audience: string): Promise<string> {
    const issuer = this.config.issuer.replace(/\/+$/, "");
    if (issuer === "") throw new Error("ServiceTokensConfig.issuer is not set");
    const body = new URLSearchParams({
      grant_type: JWT_BEARER,
      scope: `openid urn:zitadel:iam:org:project:id:${audience}:aud`,
      assertion: this.assertion(issuer),
    });
    let response: Response;
    try {
      response = await fetch(`${issuer}/oauth/v2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body,
        signal: AbortSignal.timeout(this.config.timeoutSeconds * 1000),
      });
    } catch (error) {
      // Only the failure's name: a network error never carries the request body, but nothing else is passed on.
      const name = error instanceof Error ? error.name : "Error";
      throw ServiceTokenUnavailableError.create(
        {},
        { cause: new Error(`token endpoint not reached (${name})`) },
      );
    }
    const status = `token endpoint answered ${response.status}`;
    if (response.status === 429 || response.status >= 500)
      throw ServiceTokenUnavailableError.create({}, { cause: new Error(status) });
    if (!response.ok) throw ServiceTokenRefusedError.create({}, { cause: new Error(status) });
    const answer = (await response.json().catch(() => undefined)) as
      | { access_token?: unknown; expires_in?: unknown }
      | undefined;
    const token = answer?.access_token;
    const seconds = answer?.expires_in;
    if (typeof token !== "string" || token === "" || typeof seconds !== "number" || !(seconds > 0))
      throw ServiceTokenRefusedError.create({}, { cause: new Error(`${status} without a token`) });
    const renewAt = this.clock.now().getTime() + (seconds - this.config.skewSeconds) * 1000;
    this.held.set(audience, { token, renewAt });
    return token;
  }

  /**
   * A signed JWT-profile assertion for `issuer` from the key file the secret store holds.
   *
   * @throws Error naming the secret, never its value, when it is missing or not a ZITADEL key file.
   */
  private assertion(issuer: string): string {
    const name = this.config.keySecret;
    const raw = this.secrets.get(name);
    if (raw === undefined || raw === "")
      throw new Error(`the service account key secret ${name} is not set`);
    let file: Partial<KeyFile>;
    try {
      file = JSON.parse(raw) as Partial<KeyFile>;
    } catch {
      // JSON.parse quotes the text it failed on, so its error is never passed on.
      throw new Error(`the service account key secret ${name} is not a ZITADEL key file`);
    }
    const { keyId, key, userId } = file;
    if (typeof keyId !== "string" || typeof key !== "string" || typeof userId !== "string")
      throw new Error(`the service account key secret ${name} is not a ZITADEL key file`);
    const now = Math.floor(this.clock.now().getTime() / 1000);
    const signing = `${b64url(JSON.stringify({ alg: "RS256", kid: keyId }))}.${b64url(
      JSON.stringify({
        iss: userId,
        sub: userId,
        aud: issuer,
        iat: now,
        exp: now + ASSERTION_SECONDS,
      }),
    )}`;
    let signature: Buffer;
    try {
      signature = createSign("RSA-SHA256").update(signing).sign(createPrivateKey(key));
    } catch {
      throw new Error(`the service account key secret ${name} holds no usable RSA key`);
    }
    return `${signing}.${b64url(signature)}`;
  }
}
