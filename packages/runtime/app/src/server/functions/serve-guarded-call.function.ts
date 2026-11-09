/**
 * Stackra file contract:
 * Purpose: `serveGuardedCall`, the one path every generated HTTP adapter answers through, in a fixed order: read the
 *          body once under the cap (413 before any guard), run every request guard on a request carrying the exact
 *          bytes, authenticate (an `Authorization` header is verified and never downgraded to anonymous; none is the
 *          anonymous actor only where the call lists it, else 401; an action that declares `credentials: "ignore"` reads
 *          no credential and runs anonymous; an anonymous actor is the visitor its signed token names, and an answer to
 *          a new or re-signed visitor carries the token back in a header and an httpOnly cookie; an API key's call
 *          carries its key's call options to the call), parse the input (JSON body, or the query string for
 *          GET and DELETE typed by the input schema, then the path parameters), run the call, and answer: output as 200 JSON, a refusal as its
 *          kind's status with its envelope.
 * Boundary: a guard or authentication failure is one generic answer, 401 or 403 with the code `request_refused`, saying
 *           nothing about which check failed; it never logs or echoes the body, the signature or the credential. A
 *           `RateLimitedError`, any non-refusal error and an authenticator outage propagate, for `answerHttp` (429) and
 *           Encore (500). A refusal of the call is mapped by `Enum.meta(ErrorKind, kind).httpStatus`. The call runs
 *           inside `holdCallerToken`, so its service-to-service calls forward the user's token only as ADR 0209's
 *           amendment allows (a first hop, or a second into an action that declares it), never past the call.
 * Runtime: node
 * Governing contract: ADR 0237 (STA-2577 note: every generated adapter is raw); ADR 0437 (server-check order and the
 *                     signed body hash); ADR 0457 (request guards); ADR 0140 (error envelope); ADR 0098.
 */
import { kindOf } from "@stackra/container";
import { ActorKind, Enum, mintPublicId } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import {
  ErrorKind,
  IdempotencyKeyInProgressError,
  isRefusal,
  RateLimitedError,
} from "@stackra/errors";

import { coerceQueryInput } from "#server/functions/coerce-query-input.function";
import { holdCallerToken } from "#server/functions/hold-caller-token.function";
import { pathParamsOf } from "#server/functions/path-params-of.function";
import { readCappedBody } from "#server/functions/read-capped-body.function";
import type { GuardedCallOptions } from "#server/types/guarded-call-options.type";
import type { KeyCallOptions } from "#server/types/key-call-options.type";
import type { VisitorIdentity } from "#server/types/visitor-identity.type";

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

/**
 * Answers one inbound call through the guards, the authenticator and the call itself.
 *
 * @throws RateLimitedError, a non-refusal error or an authenticator outage (as a rejection), for the adapter's answer.
 * @example
 * return serveGuardedCall({ request, path: "/orders/:orderId", maxBodyBytes, anonymous: false, guard, authenticate, execute });
 */
export async function serveGuardedCall(options: GuardedCallOptions): Promise<Response> {
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
  } else if (options.anonymous) {
    // One visitor across requests, so a record keyed to it (a guest cart) stays its own (STA-2025, 2026-11-09).
    visitor = await options.visitor?.(guarded);
    actor = { kind: ActorKind.Anonymous, id: visitor?.id ?? mintPublicId("anon") };
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
  return carry(output instanceof Response ? output : Response.json(output ?? null), visitor);
}
