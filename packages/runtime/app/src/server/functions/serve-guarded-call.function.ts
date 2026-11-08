/**
 * Stackra file contract:
 * Purpose: `serveGuardedCall`, the one path every generated HTTP adapter answers through, in a fixed order: read the
 *          body once under the cap (413 before any guard), run every request guard on a request carrying the exact
 *          bytes, authenticate (an `Authorization` header is verified and never downgraded to anonymous; none is the
 *          anonymous actor only where the call lists it, else 401), parse the input (JSON body, or the query string for
 *          GET and DELETE, then the path parameters), run the call, and answer: output as 200 JSON, a refusal as its
 *          kind's status with its envelope.
 * Boundary: a guard or authentication failure is one generic answer, 401 or 403 with the code `request_refused`, saying
 *           nothing about which check failed; it never logs or echoes the body, the signature or the credential. A
 *           `RateLimitedError`, any non-refusal error and an authenticator outage propagate, for `answerHttp` (429) and
 *           Encore (500). A refusal of the call is mapped by `Enum.meta(ErrorKind, kind).httpStatus`.
 * Runtime: node
 * Governing contract: ADR 0237 (STA-2577 note: every generated adapter is raw); ADR 0437 (server-check order and the
 *                     signed body hash); ADR 0457 (request guards); ADR 0140 (error envelope); ADR 0098.
 */
import { ActorKind, Enum, mintPublicId } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { ErrorKind, isRefusal, RateLimitedError } from "@stackra/errors";

import { pathParamsOf } from "#server/functions/path-params-of.function";
import { readCappedBody } from "#server/functions/read-capped-body.function";
import type { GuardedCallOptions } from "#server/types/guarded-call-options.type";

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

  const guarded = new Request(request.url, {
    method,
    headers: request.headers,
    ...(bytes.byteLength > 0 && method !== "GET" && method !== "HEAD" ? { body: bytes } : {}),
  });
  try {
    await options.guard(guarded);
  } catch (error) {
    if (isRefusal(error, RateLimitedError) || !isRefusal(error)) throw error;
    return refused(error.kind === ErrorKind.Unauthenticated ? 401 : 403);
  }

  const authorization = guarded.headers.get("authorization");
  const onBehalfOf = guarded.headers.get("stackra-on-behalf-of");
  let actor: Actor;
  if (authorization !== null || onBehalfOf !== null) {
    try {
      actor = (
        await options.authenticate({
          ...(authorization === null ? {} : { authorization }),
          ...(onBehalfOf === null ? {} : { onBehalfOf }),
        })
      ).actor;
    } catch (error) {
      if (isRefusal(error) && error.kind === ErrorKind.Unauthenticated) return refused(401);
      throw error;
    }
  } else if (options.anonymous) {
    actor = { kind: ActorKind.Anonymous, id: mintPublicId("anon") };
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
            return invalidBody();
          fields = parsed as Record<string, unknown>;
        } catch {
          return invalidBody();
        }
      }
    } else {
      for (const name of new Set(url.searchParams.keys())) {
        const values = url.searchParams.getAll(name);
        fields[name] = values.length === 1 ? values[0] : values;
      }
    }
    // The path wins over the body, so a caller cannot name another record than the one it addressed.
    input = { ...fields, ...pathParamsOf(options.path, url.pathname) };
  }

  let output: unknown;
  try {
    output = await options.execute(input, actor, guarded);
  } catch (error) {
    if (!isRefusal(error) || isRefusal(error, RateLimitedError)) throw error;
    return Response.json(error.toEnvelope(), {
      status: Enum.meta(ErrorKind, error.kind).httpStatus,
    });
  }
  return output instanceof Response ? output : Response.json(output ?? null);
}
