/**
 * Stackra file contract:
 * Purpose: `serveGuardedCall`, the one path every generated HTTP adapter answers through, in a fixed order: read the
 *          body once under the cap (413 before any guard), run every request guard on a request carrying the exact
 *          bytes, authenticate (an `Authorization` header is verified and never downgraded to anonymous; none is the
 *          anonymous actor only where the call lists it, else 401; an action that declares `credentials: "ignore"` reads
 *          no credential and runs anonymous; an anonymous actor is the visitor its signed token names, and an answer to
 *          a new or re-signed visitor carries the token back in a header and an httpOnly cookie; an API key's call
 *          carries its key's call options to the call; an anonymous call acts in the tenant the edge signed, and a
 *          credential whose tenant differs from it is 403), parse the input (JSON body, or the query string for
 *          GET and DELETE typed by the input schema, then the path parameters), run the call, and answer: output as 200 JSON, a refusal as its
 *          kind's status with its envelope, and a `stream: true` action's stream as server-sent events
 *          (`eventStreamResponse`), which still carries the visitor's token. Given `metrics`, every answer is recorded
 *          in the stable `http.server.request.duration` histogram (`HTTP_SERVER_DURATION`: seconds, the advised
 *          bounds) with `http.request.method`, `http.route` (the route template) and `http.response.status_code`;
 *          a propagated error counts as the status it becomes (429 for `RateLimitedError`, else 500). The
 *          service-level objectives of `@stackra/infra-observability` read exactly this series.
 * Boundary: a guard or authentication failure is one generic answer, 401 or 403 with the code `request_refused`, saying
 *           nothing about which check failed; it never logs or echoes the body, the signature or the credential. A
 *           `RateLimitedError`, any non-refusal error and an authenticator outage propagate, for `answerHttp` (429) and
 *           Encore (500). A refusal of the call is mapped by `Enum.meta(ErrorKind, kind).httpStatus`. The call runs
 *           inside `holdCallerToken`, so its service-to-service calls forward the user's token only as ADR 0209's
 *           amendment allows (a first hop, or a second into an action that declares it), never past the call; a
 *           streamed call ends when its stream does. The duration ends when the answer starts (a stream's body is not
 *           timed); recording never changes the answer and the path, query, body and actor are never attributes.
 * Runtime: node
 * Governing contract: ADR 0237 (STA-2577 note: every generated adapter is raw); ADR 0437 (server-check order and the
 *                     signed body hash); ADR 0457 (request guards); ADR 0140 (error envelope); ADR 0098; ADR 0184
 *                     (decisions 1 and 3: the HTTP server histogram the objectives read).
 */
import { kindOf } from "@stackra/container";
import {
  ActorKind,
  actingScopeId,
  Enum,
  HTTP_SERVER_DURATION,
  mintPublicId,
} from "@stackra/contracts";
import type { Actor, Metrics } from "@stackra/contracts";
import {
  ErrorKind,
  IdempotencyKeyInProgressError,
  isRefusal,
  RateLimitedError,
} from "@stackra/errors";

import { VERIFIED_EDGE_SCOPE } from "#server/constants/verified-edge-scope.constant";
import { coerceQueryInput } from "#server/functions/coerce-query-input.function";
import { eventStreamResponse } from "#server/functions/event-stream-response.function";
import { holdCallerToken } from "#server/functions/hold-caller-token.function";
import { pathParamsOf } from "#server/functions/path-params-of.function";
import { readCappedBody } from "#server/functions/read-capped-body.function";
import type { GuardedCallOptions } from "#server/types/guarded-call-options.type";
import type { KeyCallOptions } from "#server/types/key-call-options.type";
import type { VisitorIdentity } from "#server/types/visitor-identity.type";

/** The methods the HTTP semantic conventions name; any other is recorded as `_OTHER`. */
const KNOWN_METHODS: ReadonlySet<string> = new Set([
  "CONNECT",
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
  "TRACE",
]);

/** Methods whose input is the body; every other method's input is the query string. */
const BODY_METHODS: ReadonlySet<string> = new Set(["POST", "PUT", "PATCH"]);

/** The one answer of a refused call: no detail on which check failed. */
function refused(status: 401 | 403): Response {
  return Response.json(
    {
      code: "request_refused",
      category: status === 401 ? "unauthenticated" : "forbidden",
      retryable: false,
    },
    { status },
  );
}

/** A 400 for a body that is not a JSON object. */
function invalidBody(): Response {
  return Response.json(
    { code: "invalid_body", category: "validation", retryable: false },
    { status: 400 },
  );
}

/** `response` carrying `visitor`'s token back, when it has one to carry. */
function carry(response: Response, visitor: VisitorIdentity | undefined): Response {
  if (visitor?.issue === undefined) return response;
  // A raw controller's answer may have immutable headers: copy it once.
  const answer = new Response(response.body, response);
  answer.headers.set(visitor.issue.header, visitor.issue.token);
  answer.headers.append("set-cookie", visitor.issue.cookie);
  return answer;
}

/** Records one answered call of `options` in `metrics`, which took `seconds` and answered `status`. */
function record(
  metrics: Metrics,
  options: GuardedCallOptions,
  seconds: number,
  status: number,
): void {
  const method = options.request.method.toUpperCase();
  metrics.histogram(
    HTTP_SERVER_DURATION.name,
    seconds,
    {
      "http.request.method": KNOWN_METHODS.has(method) ? method : "_OTHER",
      "http.route": options.path,
      "http.response.status_code": status,
    },
    { unit: HTTP_SERVER_DURATION.unit, bounds: HTTP_SERVER_DURATION.bounds },
  );
}

/**
 * Answers one inbound call through the guards, the authenticator and the call itself, and records it in
 * `options.metrics` when given.
 *
 * @throws RateLimitedError, a non-refusal error or an authenticator outage (as a rejection), for the adapter's answer.
 * @example
 * return serveGuardedCall({ request, path: "/orders/:orderId", maxBodyBytes, anonymous: false, guard, authenticate, execute, metrics });
 */
export async function serveGuardedCall(options: GuardedCallOptions): Promise<Response> {
  const { metrics } = options;
  if (metrics === undefined) return respond(options);
  const started = performance.now();
  // What the caller is answered when the call throws: the adapter's 429, or Encore's 500.
  let status = 500;
  try {
    const response = await respond(options);
    status = response.status;
    return response;
  } catch (error) {
    if (isRefusal(error, RateLimitedError)) status = 429;
    throw error;
  } finally {
    record(metrics, options, (performance.now() - started) / 1000, status);
  }
}

/** The answer of one call, in the server-check order (ADR 0437). */
async function respond(options: GuardedCallOptions): Promise<Response> {
  const { request } = options;
  const method = request.method.toUpperCase();
  const declared = Number(request.headers.get("content-length") ?? 0);
  const bytes =
    declared > options.maxBodyBytes
      ? undefined
      : await readCappedBody(request.body, options.maxBodyBytes);
  if (bytes === undefined)
    return Response.json(
      { code: "payload_too_large", category: "validation", retryable: false },
      { status: 413 },
    );

  const init: RequestInit = { method, headers: request.headers };
  if (bytes.byteLength > 0 && method !== "GET" && method !== "HEAD")
    init.body = new Uint8Array(bytes);
  const guarded = new Request(request.url, init);
  try {
    await options.guard(guarded);
  } catch (error) {
    if (isRefusal(error, RateLimitedError) || !isRefusal(error)) throw error;
    return refused(error.kind === ErrorKind.Unauthenticated ? 401 : 403);
  }

  const authorization = guarded.headers.get("authorization");
  const onBehalfOf = guarded.headers.get("stackra-on-behalf-of");
  const origin = guarded.headers.get("origin");
  // `credentials: "ignore"`: the credential is never verified or held, so no user token is forwarded either
  const ignored =
    options.action !== undefined && kindOf(options.action)?.options["credentials"] === "ignore";
  // Set by the edge guard above only for a verified signature; a raw tenant header never counts.
  const signedScope = VERIFIED_EDGE_SCOPE.get(guarded);
  let actor: Actor;
  let call: KeyCallOptions | undefined;
  let visitor: VisitorIdentity | undefined;
  if (!ignored && (authorization !== null || onBehalfOf !== null)) {
    try {
      ({ actor, call } = await options.authenticate({
        ...(authorization === null ? {} : { authorization }),
        ...(onBehalfOf === null ? {} : { onBehalfOf }),
        ...(origin === null ? {} : { origin }),
      }));
    } catch (error) {
      if (isRefusal(error) && error.kind === ErrorKind.Unauthenticated) return refused(401);
      throw error;
    }
    // The token's tenant wins; a signed host tenant that differs means the token was sent to another tenant's host.
    const tokenScope = actingScopeId(actor);
    if (signedScope !== undefined && tokenScope !== undefined && tokenScope !== signedScope)
      return refused(403);
  } else if (options.anonymous) {
    // One visitor across requests, so a record keyed to it (a guest cart) stays its own (STA-2025, 2026-11-09).
    visitor = await options.visitor?.(guarded);
    // A visitor's tenant is the host's, and only when the edge signed it (ADR 0437); unsigned, there is none.
    actor = {
      kind: ActorKind.Anonymous,
      id: visitor?.id ?? mintPublicId("anon"),
      ...(signedScope === undefined ? {} : { scopeId: signedScope }),
    };
  } else {
    return refused(401);
  }

  let input: unknown = {};
  if (options.raw !== true) {
    const url = new URL(guarded.url);
    let fields: Record<string, unknown> = {};
    if (BODY_METHODS.has(method)) {
      if (bytes.byteLength > 0) {
        try {
          const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
          if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
            return carry(invalidBody(), visitor);
          fields = parsed as Record<string, unknown>;
        } catch {
          return carry(invalidBody(), visitor);
        }
      }
    } else {
      for (const name of new Set(url.searchParams.keys())) {
        const values = url.searchParams.getAll(name);
        fields[name] = values.length === 1 ? values[0] : values;
      }
    }
    // The path wins over the body, so a caller cannot name another record than the one it addressed.
    if (!BODY_METHODS.has(method)) fields = coerceQueryInput(fields, options.input);
    input = { ...fields, ...pathParamsOf(options.path, url.pathname) };
  }

  let output: unknown;
  try {
    // The one place a call's forwardable user token is held: for this call only, emptied when it ends (ADR 0209).
    output = await holdCallerToken(guarded.headers, actor, options.action, () =>
      options.execute(input, actor, guarded, call),
    );
  } catch (error) {
    if (!isRefusal(error) || isRefusal(error, RateLimitedError)) throw error;
    return carry(
      Response.json(error.toEnvelope(), {
        status: Enum.meta(ErrorKind, error.kind).httpStatus,
        // the first call with this key is still running: ask the client to retry shortly
        ...(isRefusal(error, IdempotencyKeyInProgressError)
          ? { headers: { "Retry-After": "1" } }
          : {}),
      }),
      visitor,
    );
  }
  // a `stream: true` action answers its stream as server-sent events (holdCallerToken already wrapped its end)
  if (
    output instanceof ReadableStream &&
    options.action !== undefined &&
    kindOf(options.action)?.options["stream"] === true
  )
    return carry(eventStreamResponse(output), visitor);
  return carry(output instanceof Response ? output : Response.json(output ?? null), visitor);
}
