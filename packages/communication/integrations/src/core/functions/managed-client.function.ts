/**
 * Stackra file contract:
 * Purpose: `managedClient`, the client behind `integration.api` and `connection.api`: it joins a path to the
 *          Integration's `baseUrl`, so a call never leaves its origin (the egress allowlist), adds the credentials
 *          of the Integration's `auth` type (an OAuth token in the header and layout `auth.token` names) and its
 *          declared `headers`, keeps to its rate limits, retries what is safe to retry, and turns every
 *          provider outcome into a value or a typed refusal.
 * Boundary: internal; `IntegrationRuntime#client` builds it. JSON in and out, or a form body when the call or the
 *           Integration's `requestBody` asks, or a raw body with its own media type when the call gives one (`body`);
 *           raw bytes or text out when the call asks (`bytes`, `text`); `send` returns the answer as it came, at
 *           any status, and throws only when nothing came back (STA-2607). A
 *           `{field}` placeholder in the base URL (a per-region host) is filled from the credential set and must
 *           resolve to an https origin, or an http one on an `.internal` host (the private tools namespace, STA-1653);
 *           a whole-URL `{field}` is filled the same way. A `GET`, `HEAD`, `PUT` or `DELETE`
 *           retries on no answer, 408, 429 or 5xx; a `POST` or `PATCH` only with an idempotency key the provider
 *           deduplicates on. Each attempt is aborted at the Integration's `timeout` (30 s by default, the body read
 *           included) and goes through the circuit breaker and bulkhead the runtime keeps for its origin (`guardsOf`):
 *           an open circuit or a full bulkhead refuses it without sending (STA-1467); an answer counts as one for the
 *           circuit only once its body is read, so a provider that sends headers and then stalls opens it too, and a
 *           caller that gives up while queued for the bulkhead leaves the queue at once. A 4xx is `ProviderRefusedError`;
 *           spent retries, a bucket full past the longest wait, an open circuit or a full bulkhead are
 *           `ProviderUnavailableError`, with a `reason` when the client itself gave up. No credential, token or response body is ever put in an error: the
 *           provider's code is scrubbed against the call's credentials (the connection's and the Integration's
 *           `@Secret` values and the key, password or token sent) before the refusal is built. A bucket key names the
 *           connection id (or `platform`), never a credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 4, 6, 13 and 20); ADR 0217 (token buckets); ADR 0140 (refusals); STA-793;
 *                     owner D10 2026-10-28 (stackra-223): the waits are the contracts `backoffDelay`; STA-1467
 *                     (per-attempt timeout, circuit breaker and bulkhead).
 */
import { Secret } from "@stackra/config";
import type { AnyClass } from "@stackra/container";
import { backoffDelay, Duration } from "@stackra/contracts";
import type { CircuitTicket } from "@stackra/contracts";

import type { Connection } from "#core/bases/connection.base";
import { AuthType } from "#core/enums/auth-type.enum";
import { RateLimitScope } from "#core/enums/rate-limit-scope.enum";
import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import { ProviderUnavailableError } from "#core/errors/provider-unavailable.error";
import { encodeBase64 } from "#core/functions/encode-base64.function";
import { integrationOptionsOf } from "#core/functions/integration-options-of.function";
import { placeholderLookup } from "#core/functions/placeholder-lookup.function";
import { providerCodeOf } from "#core/functions/provider-code-of.function";
import { redactSecrets } from "#core/functions/redact-secrets.function";
import { resolvePlaceholders } from "#core/functions/resolve-placeholders.function";
import { signJwt } from "#core/functions/sign-jwt.function";
import type { IntegrationApi } from "#core/types/integration-api.type";
import type { ManagedClientOptions } from "#core/types/managed-client-options.type";
import type { RawRequest } from "#core/types/raw-request.type";
import type { RawResponse } from "#core/types/raw-response.type";
import type { RequestOptions } from "#core/types/request-options.type";

/** The retry an Integration gets when it states none, unchanged by stackra-223: 3 attempts, 200 ms doubling, 30 s. */
const RETRY = Object.freeze({
  attempts: 3,
  base: Duration.parse("200ms"),
  max: Duration.seconds(30),
});

/** How long one attempt may take when the Integration states no `timeout` (STA-1467). */
const TIMEOUT = Duration.seconds(30);

/**
 * One attempt as sent: its answer (undefined when nothing came back), the error when nothing did, whether the
 * Integration's `timeout` cut it short, its circuit ticket (settled already for a failure or a 429, reported by the body
 * read otherwise), and `finish`, which disarms its timer, frees its bulkhead place and frees a trial place the read
 * did not report (idempotent).
 */
interface Attempt {
  readonly response: Response | undefined;
  readonly failure: unknown;
  readonly timedOut: () => boolean;
  readonly ticket: CircuitTicket | undefined;
  readonly finish: () => void;
}

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
  const timeoutMs = Duration.toMilliseconds(declared.timeout ?? TIMEOUT);
  const connectionSecrets =
    connection === undefined ? [] : [...Secret.members(connection.constructor as AnyClass).keys()];
  const integrationSecrets = [...Secret.members(integration.constructor as AnyClass).values()];

  /** The credential values of one call, read now: `@Secret` values and what `authorize` sent. */
  function credentialsOf(sent: readonly string[]): (string | undefined)[] {
    return [
      ...connectionSecrets.map((field) => {
        const value: unknown = Reflect.get(connection ?? {}, field);
        return typeof value === "string" ? value : undefined;
      }),
      ...integrationSecrets.map((secretName) => secrets.get(secretName)),
      ...sent,
    ];
  }

  /** The full URL of `path`: always joined under the base URL, so even an absolute URL stays on its origin. */
  function urlOf(path: string, query: RequestOptions["query"]): URL {
    if (declared.baseUrl === undefined)
      throw new TypeError(`${name} declares no baseUrl, so it has no API to call`);
    const base = resolve(declared.baseUrl).replace(/\/+$/, "");
    if (base !== declared.baseUrl.replace(/\/+$/, "")) {
      // http is allowed only on the private tools namespace until TLS there (STA-1653)
      const { protocol, hostname } = URL.canParse(base) ? new URL(base) : new URL("x:");
      if (protocol !== "https:" && !(protocol === "http:" && hostname.endsWith(".internal")))
        throw new TypeError(
          `${name}'s baseUrl must resolve to an https origin (http only on an .internal host)`,
        );
    }
    const url = new URL(`${base}/${path.replace(/^\/+/, "")}`);
    for (const [key, value] of Object.entries(query ?? {}))
      url.searchParams.set(key, String(value));
    return url;
  }

  /** Adds the credentials of the Integration's `auth` type, and lists each credential value it sent in `sent`. */
  async function authorize(headers: Headers, url: URL, sent: string[]): Promise<void> {
    /** `resolve`, listing each placeholder value it fills in `sent`. */
    const resolveSent = (template: string): string =>
      resolvePlaceholders(template, (field) => {
        const value = lookup(field);
        if (value !== undefined) sent.push(value);
        return value;
      });
    switch (auth.type) {
      case AuthType.None: {
        return;
      }
      case AuthType.ApiKey: {
        const value = resolveSent(auth.format ?? "{apiKey}");
        if (auth.header !== undefined) headers.set(auth.header, value);
        else if (auth.query !== undefined) url.searchParams.set(auth.query, value);
        return;
      }
      case AuthType.Basic: {
        const basic = encodeBase64(`${resolveSent(auth.username)}:${resolveSent(auth.password)}`);
        sent.push(basic);
        headers.set("authorization", `Basic ${basic}`);
        return;
      }
      case AuthType.Jwt: {
        const jwt = await signJwt(auth, resolveSent, clock.now());
        sent.push(jwt);
        headers.set(auth.header ?? "authorization", `Bearer ${jwt}`);
        return;
      }
      case AuthType.OAuth2Code:
      case AuthType.OAuth2ClientCredentials:
      case AuthType.OAuth2JwtBearer: {
        if (options.accessToken === undefined)
          throw new TypeError(
            `${name} authenticates with OAuth, so it calls only through a connection that holds its tokens`,
          );
        const token = await options.accessToken();
        sent.push(token);
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

  /**
   * Sends one attempt through the circuit breaker and bulkhead of its origin, aborted at the Integration's `timeout`
   * or by the caller's signal, and reports its outcome to the breaker: no answer, a timeout, 408 or a 5xx is a
   * failure, a 429 says nothing about the provider's health, and any other answer is left to `readBody`, which counts
   * it as one only once its body arrived. `finish` disarms the timer and gives the bulkhead place back once the
   * answer's body is read (or dropped), so the timeout also bounds the read. A caller that aborts while the attempt
   * waits for a bulkhead place leaves the queue at once.
   *
   * @throws ProviderUnavailableError without sending when the circuit is open (`circuit_open`) or the bulkhead and its
   *         queue are full (`bulkhead_full`), carrying the status of `previous`, the attempt before it.
   * @throws the caller's abort reason when the caller's signal aborted the attempt.
   */
  async function attemptOnce(
    url: URL,
    init: RequestInit,
    caller: AbortSignal | undefined,
    previous: Response | undefined,
  ): Promise<Attempt> {
    // A caller that already gave up sends nothing and holds no place.
    caller?.throwIfAborted();
    const { breaker, bulkhead } = options.guardsOf?.(url.origin) ?? {};
    const status = previous === undefined ? {} : { status: previous.status };
    const ticket = breaker?.admit(clock.now().getTime());
    if (breaker !== undefined && ticket === undefined)
      throw ProviderUnavailableError.create({
        provider,
        ...status,
        reason: "circuit_open",
        retryAfterMs: breaker.retryAfterMs(clock.now().getTime()),
      });
    const release = bulkhead === undefined ? undefined : await bulkhead.enter(caller);
    if (bulkhead !== undefined && release === undefined) {
      ticket?.release();
      // A caller that gave up while queued gets its own reason, not a refusal.
      caller?.throwIfAborted();
      throw ProviderUnavailableError.create({ provider, ...status, reason: "bulkhead_full" });
    }
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onAbort = (): void => {
      controller.abort(caller?.reason);
    };
    if (caller?.aborted === true) onAbort();
    else caller?.addEventListener("abort", onAbort, { once: true });
    let finished = false;
    const finish = (): void => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      caller?.removeEventListener("abort", onAbort);
      release?.();
      // An answer dropped unread (the caller gave up) says nothing about the provider: free its trial place.
      ticket?.release();
    };
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (response.status === 408 || response.status >= 500) ticket?.fail(clock.now().getTime());
      else if (response.status === 429) ticket?.release();
      return { response, failure: undefined, timedOut: () => timedOut, ticket, finish };
    } catch (error) {
      // Settle the ticket before `finish`, which frees an unsettled one without counting it.
      if (caller?.aborted === true) {
        ticket?.release();
        finish();
        throw error;
      }
      ticket?.fail(clock.now().getTime());
      finish();
      return { response: undefined, failure: error, timedOut: () => timedOut, ticket, finish };
    }
  }

  /**
   * Builds one call and sends it with its retries: the first answer that is not transient, or the last one once the
   * retries are spent; `response` is undefined when nothing came back. `sent` lists the credential values it sent;
   * the caller calls `finish` once it read the answer.
   */
  async function exchange(
    method: string,
    path: string,
    body: unknown,
    request: RequestOptions,
  ): Promise<Attempt & { readonly sent: readonly string[] }> {
    if (request.body !== undefined && body !== undefined)
      throw new TypeError("A call sends either its body or RequestOptions.body, not both");
    const url = urlOf(path, request.query);
    const form = request.form ?? declared.requestBody === "form";
    const raw = request.body;
    const headers = new Headers(request.headers);
    for (const [header, value] of Object.entries(declared.headers ?? {}))
      if (!headers.has(header)) headers.set(header, resolve(value));
    if (!headers.has("accept"))
      headers.set(
        "accept",
        request.bytes === true || request.text === true ? "*/*" : "application/json",
      );
    if (raw !== undefined) headers.set("content-type", raw.contentType);
    else if (body !== undefined)
      headers.set("content-type", form ? "application/x-www-form-urlencoded" : "application/json");
    const key = request.idempotencyKey;
    if (key !== undefined && idempotencyHeader !== undefined) headers.set(idempotencyHeader, key);
    const retryable =
      IDEMPOTENT_METHODS.has(method) || (key !== undefined && idempotencyHeader !== undefined);
    const sent: string[] = [];
    await authorize(headers, url, sent);
    const init: RequestInit = {
      method,
      headers,
      ...(raw !== undefined
        ? { body: raw.content }
        : body === undefined
          ? {}
          : { body: form ? formOf(body) : JSON.stringify(body) }),
    };
    let previous: Response | undefined;
    for (let attempt = 1; ; attempt += 1) {
      await takeRateLimits();
      const outcome = await attemptOnce(url, init, request.signal, previous);
      const { response } = outcome;
      if (response !== undefined && !isTransient(response.status)) return { ...outcome, sent };
      if (!retryable || attempt >= attempts) return { ...outcome, sent };
      outcome.finish();
      // Free the connection of an answer that is not read.
      await response?.body?.cancel().catch(() => undefined);
      previous = response;
      await sleep(
        Math.min(retryAfterMs(response, clock.now()) ?? backoffDelay(policy, attempt), maxDelay),
      );
    }
  }

  /**
   * Reads an answer's body and reports the attempt to the circuit: a body that arrived is an answer; a read the timeout
   * cut short, or a connection dropped mid-answer, is a failure and `ProviderUnavailableError`; a read the caller
   * aborted counts as neither and throws the caller's reason.
   */
  async function readBody<T>(
    outcome: Attempt,
    caller: AbortSignal | undefined,
    read: () => Promise<T>,
  ): Promise<T> {
    try {
      const body = await read();
      outcome.ticket?.succeed();
      return body;
    } catch (error) {
      if (caller?.aborted === true) throw error;
      outcome.ticket?.fail(clock.now().getTime());
      throw ProviderUnavailableError.create(
        {
          provider,
          ...(outcome.response === undefined ? {} : { status: outcome.response.status }),
          ...(outcome.timedOut() ? { reason: "timeout" as const } : {}),
        },
        { cause: error },
      );
    }
  }

  /** The refusal of a call that got no usable answer: the last status, and `timeout` when the last attempt timed out. */
  function unavailable(outcome: Attempt): ProviderUnavailableError {
    const { response, failure } = outcome;
    return ProviderUnavailableError.create(
      {
        provider,
        ...(response === undefined ? {} : { status: response.status }),
        ...(response === undefined && outcome.timedOut() ? { reason: "timeout" as const } : {}),
      },
      { cause: failure },
    );
  }

  /** Sends one typed call and reads the answer, or refuses with the provider's outcome. */
  async function call(
    method: string,
    path: string,
    body: unknown,
    request: RequestOptions = {},
  ): Promise<unknown> {
    const outcome = await exchange(method, path, body, request);
    const { response, sent } = outcome;
    try {
      if (response?.ok === true) {
        if (request.bytes === true)
          return new Uint8Array(
            await readBody(outcome, request.signal, () => response.arrayBuffer()),
          );
        const text = await readBody(outcome, request.signal, () => response.text());
        if (request.text === true) return text;
        return text === "" ? undefined : parsed(text);
      }
      if (response !== undefined && !isTransient(response.status)) {
        const code = providerCodeOf(
          parsed(await readBody(outcome, request.signal, () => response.text())),
        );
        throw ProviderRefusedError.create({
          provider,
          status: response.status,
          ...(code === undefined ? {} : { code: redactSecrets(code, credentialsOf(sent)) }),
        });
      }
      throw unavailable(outcome);
    } finally {
      outcome.finish();
    }
  }

  /** Sends `raw` and returns the answer as it came, whatever its status. */
  async function send(raw: RawRequest): Promise<RawResponse> {
    const outcome = await exchange(raw.method, raw.path, undefined, {
      text: true,
      ...(raw.headers === undefined ? {} : { headers: raw.headers }),
      ...(raw.body === undefined ? {} : { body: raw.body }),
      ...(raw.idempotencyKey === undefined ? {} : { idempotencyKey: raw.idempotencyKey }),
      ...(raw.signal === undefined ? {} : { signal: raw.signal }),
    });
    try {
      const { response } = outcome;
      if (response === undefined) throw unavailable(outcome);
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await readBody(outcome, raw.signal, () => response.text()),
      };
    } finally {
      outcome.finish();
    }
  }

  return {
    get: <T>(path: string, request?: RequestOptions) =>
      call("GET", path, undefined, request) as Promise<T>,
    delete: <T>(path: string, request?: RequestOptions) =>
      call("DELETE", path, undefined, request) as Promise<T>,
    post: <T>(path: string, body?: unknown, request?: RequestOptions) =>
      call("POST", path, body, request) as Promise<T>,
    put: <T>(path: string, body?: unknown, request?: RequestOptions) =>
      call("PUT", path, body, request) as Promise<T>,
    patch: <T>(path: string, body?: unknown, request?: RequestOptions) =>
      call("PATCH", path, body, request) as Promise<T>,
    send,
  };
}
