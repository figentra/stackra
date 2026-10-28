/**
 * Stackra file contract:
 * Purpose: `managedClient`, the client behind `integration.api` and `connection.api`: it joins a path to the
 *          Integration's `baseUrl`, so a call never leaves its origin (the egress allowlist), adds the credentials
 *          of the Integration's `auth` type (an OAuth token in the header and layout `auth.token` names) and its
 *          declared `headers`, keeps to its rate limits, retries what is safe to retry, and turns every
 *          provider outcome into a value or a typed refusal.
 * Boundary: internal; `IntegrationRuntime#client` builds it. JSON in and out, or a form body when the call or the
 *           Integration's `requestBody` asks. A
 *           `{field}` placeholder in the base URL (a per-region host) is filled from the credential set and must
 *           resolve to an https origin. A `GET`, `HEAD`, `PUT` or `DELETE`
 *           retries on no answer, 408, 429 or 5xx; a `POST` or `PATCH` only with an idempotency key the provider
 *           deduplicates on. A 4xx is `ProviderRefusedError`; spent retries, or a bucket full past the longest wait,
 *           are `ProviderUnavailableError`. No credential, token or response body is ever put in an error. A bucket
 *           key names the connection id (or `platform`), never a credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 4, 6, 13 and 20); ADR 0217 (token buckets); ADR 0140 (refusals); STA-793;
 *                     owner D10 2026-10-28 (stackra-223): the waits are the contracts `backoffDelay`.
 */
import { backoffDelay, Duration } from "@stackra/contracts";

import type { Connection } from "#core/bases/connection.base";
import { AuthType } from "#core/enums/auth-type.enum";
import { RateLimitScope } from "#core/enums/rate-limit-scope.enum";
import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import { ProviderUnavailableError } from "#core/errors/provider-unavailable.error";
import { encodeBase64 } from "#core/functions/encode-base64.function";
import { integrationOptionsOf } from "#core/functions/integration-options-of.function";
import { placeholderLookup } from "#core/functions/placeholder-lookup.function";
import { providerCodeOf } from "#core/functions/provider-code-of.function";
import { resolvePlaceholders } from "#core/functions/resolve-placeholders.function";
import { signJwt } from "#core/functions/sign-jwt.function";
import type { IntegrationApi } from "#core/types/integration-api.type";
import type { ManagedClientOptions } from "#core/types/managed-client-options.type";
import type { RequestOptions } from "#core/types/request-options.type";

/** The retry an Integration gets when it states none, unchanged by stackra-223: 3 attempts, 200 ms doubling, 30 s. */
const RETRY = Object.freeze({
  attempts: 3,
  base: Duration.parse("200ms"),
  max: Duration.seconds(30),
});

/** Methods that act the same however often they are sent. */
const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "PUT", "DELETE"]);

/** Whether a status means "try again later": a timeout, a rate limit or a server failure. */
const isTransient = (status: number): boolean => status === 408 || status === 429 || status >= 500;

/** Waits `ms` milliseconds. */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** The JSON of `text`, or the text itself when it is not JSON. */
function parsed(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** The milliseconds a `Retry-After` header asks for (seconds or an HTTP date), or undefined. */
function retryAfterMs(response: Response | undefined, now: Date): number | undefined {
  const header = response?.headers.get("retry-after");
  if (header === null || header === undefined) return undefined;
  if (/^\d+$/.test(header)) return Number(header) * 1000;
  const at = Date.parse(header);
  return Number.isNaN(at) ? undefined : Math.max(0, at - now.getTime());
}

/**
 * `body` as a form: each field once, an array field repeated (`To=a&To=b`), undefined fields left out.
 *
 * @throws TypeError when `body` is not a flat record.
 */
function formOf(body: unknown): string {
  if (typeof body !== "object" || body === null || Array.isArray(body))
    throw new TypeError("A form body must be a flat record");
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (typeof item === "object" && item !== null)
        throw new TypeError(`Form field ${key} must be a string, a number or a boolean`);
      form.append(key, String(item));
    }
  }
  return form.toString();
}

/** The id the rate limits count a connection's calls under; `platform` for the Integration's own credentials. */
const credentialOf = (connection: Connection | undefined): string =>
  connection === undefined ? "platform" : connection.id;

/**
 * The managed client of one credential set.
 *
 * @example
 * const api = managedClient({ integration, connection, secrets, limits, clock });
 * const sent = await api.post<ResendSendResult>("/emails", mail, { idempotencyKey });
 */
export function managedClient(options: ManagedClientOptions): IntegrationApi {
  const { integration, connection, secrets, limits, clock } = options;
  const name = integration.constructor.name;
  const declared = integrationOptionsOf(integration.constructor);
  const { provider, auth } = declared;
  const lookup = placeholderLookup(integration, connection, secrets);
  const resolve = (template: string): string => resolvePlaceholders(template, lookup);
  const { idempotencyHeader, ...policy } = { ...RETRY, ...declared.retry };
  const { attempts } = policy;
  const maxDelay = Duration.toMilliseconds(policy.max);

  /** The full URL of `path`: always joined under the base URL, so even an absolute URL stays on its origin. */
  function urlOf(path: string, query: RequestOptions["query"]): URL {
    if (declared.baseUrl === undefined)
      throw new TypeError(`${name} declares no baseUrl, so it has no API to call`);
    const base = resolve(declared.baseUrl).replace(/\/+$/, "");
    if (base !== declared.baseUrl.replace(/\/+$/, "") && new URL(base).protocol !== "https:")
      throw new TypeError(`${name}'s baseUrl must resolve to an https origin`);
    const url = new URL(`${base}/${path.replace(/^\/+/, "")}`);
    for (const [key, value] of Object.entries(query ?? {}))
      url.searchParams.set(key, String(value));
    return url;
  }

  /** Adds the credentials of the Integration's `auth` type. */
  async function authorize(headers: Headers, url: URL): Promise<void> {
    switch (auth.type) {
      case AuthType.None:
        return;
      case AuthType.ApiKey: {
        const value = resolve(auth.format ?? "{apiKey}");
        if (auth.header !== undefined) headers.set(auth.header, value);
        else if (auth.query !== undefined) url.searchParams.set(auth.query, value);
        return;
      }
      case AuthType.Basic:
        headers.set(
          "authorization",
          `Basic ${encodeBase64(`${resolve(auth.username)}:${resolve(auth.password)}`)}`,
        );
        return;
      case AuthType.Jwt:
        headers.set(
          auth.header ?? "authorization",
          `Bearer ${await signJwt(auth, resolve, clock.now())}`,
        );
        return;
      case AuthType.OAuth2Code:
      case AuthType.OAuth2ClientCredentials:
      case AuthType.OAuth2JwtBearer: {
        if (options.accessToken === undefined)
          throw new TypeError(
            `${name} authenticates with OAuth, so it calls only through a connection that holds its tokens`,
          );
        const token = await options.accessToken();
        headers.set(
          auth.token?.header ?? "authorization",
          (auth.token?.format ?? "Bearer {accessToken}").replace("{accessToken}", token),
        );
      }
    }
  }

  /** Takes a token from every rate-limit bucket, waiting once for a full one when the wait is short enough. */
  async function takeRateLimits(): Promise<void> {
    for (const [index, limit] of (declared.rateLimits ?? []).entries()) {
      const owner = limit.by === RateLimitScope.Credential ? credentialOf(connection) : "*";
      const key = `integrations:${name}:${owner}:${index}`;
      const bucket = {
        capacity: limit.requests,
        tokensPerSecond: (limit.requests * 1000) / Duration.toMilliseconds(limit.per),
      };
      let decision = await limits.take(key, bucket, clock.now());
      if (!decision.allowed && decision.retryAfterMs <= maxDelay) {
        await sleep(decision.retryAfterMs);
        decision = await limits.take(key, bucket, clock.now());
      }
      if (!decision.allowed)
        throw ProviderUnavailableError.create({ provider, retryAfterMs: decision.retryAfterMs });
    }
  }

  /** Sends one call with its retries and reads the answer. */
  async function send(
    method: string,
    path: string,
    body: unknown,
    request: RequestOptions = {},
  ): Promise<unknown> {
    const url = urlOf(path, request.query);
    const form = request.form ?? declared.requestBody === "form";
    const headers = new Headers(request.headers);
    for (const [header, value] of Object.entries(declared.headers ?? {}))
      if (!headers.has(header)) headers.set(header, resolve(value));
    if (!headers.has("accept")) headers.set("accept", "application/json");
    if (body !== undefined)
      headers.set("content-type", form ? "application/x-www-form-urlencoded" : "application/json");
    const key = request.idempotencyKey;
    if (key !== undefined && idempotencyHeader !== undefined) headers.set(idempotencyHeader, key);
    const retryable =
      IDEMPOTENT_METHODS.has(method) || (key !== undefined && idempotencyHeader !== undefined);
    await authorize(headers, url);
    const init: RequestInit = {
      method,
      headers,
      ...(body === undefined ? {} : { body: form ? formOf(body) : JSON.stringify(body) }),
      ...(request.signal === undefined ? {} : { signal: request.signal }),
    };
    for (let attempt = 1; ; attempt += 1) {
      await takeRateLimits();
      let response: Response | undefined;
      let failure: unknown;
      try {
        response = await fetch(url, init);
      } catch (error) {
        if (request.signal?.aborted === true) throw error;
        failure = error;
      }
      if (response?.ok === true) {
        const text = await response.text();
        return text === "" ? undefined : parsed(text);
      }
      if (response !== undefined && !isTransient(response.status)) {
        const code = providerCodeOf(parsed(await response.text()));
        throw ProviderRefusedError.create({
          provider,
          status: response.status,
          ...(code === undefined ? {} : { code }),
        });
      }
      if (!retryable || attempt >= attempts)
        throw ProviderUnavailableError.create(
          { provider, ...(response === undefined ? {} : { status: response.status }) },
          { cause: failure },
        );
      await sleep(
        Math.min(retryAfterMs(response, clock.now()) ?? backoffDelay(policy, attempt), maxDelay),
      );
    }
  }

  return {
    get: <T>(path: string, request?: RequestOptions) =>
      send("GET", path, undefined, request) as Promise<T>,
    delete: <T>(path: string, request?: RequestOptions) =>
      send("DELETE", path, undefined, request) as Promise<T>,
    post: <T>(path: string, body?: unknown, request?: RequestOptions) =>
      send("POST", path, body, request) as Promise<T>,
    put: <T>(path: string, body?: unknown, request?: RequestOptions) =>
      send("PUT", path, body, request) as Promise<T>,
    patch: <T>(path: string, body?: unknown, request?: RequestOptions) =>
      send("PATCH", path, body, request) as Promise<T>,
  };
}
