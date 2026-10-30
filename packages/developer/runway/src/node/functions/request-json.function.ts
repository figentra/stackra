/**
 * Stackra file contract:
 * Purpose: `requestJson(fetcher, request)`, one JSON request of a store driver (App Store Connect, Google, Firebase,
 *          Play, Expo, Sentry, Infisical): sends it, parses the answer, and throws on a status the caller does not
 *          accept, naming the step, the status and the API's own message.
 * Boundary: the request's headers carry the bearer token and its body may carry a secret: neither is ever put in an
 *           error or a log. The error text is the step, the status and the API's error message, which never echoes
 *           a credential.
 * Runtime: node
 * Governing contract: ADR 0482 (decisions 4 and 7), ADR 0173.
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { JsonAnswer } from "#node/types/json-answer.type";

/** The API's own error message, from the shapes Google, Apple, Sentry, Expo and Infisical use. */
function messageOf(body: Record<string, unknown>): string | undefined {
  const error = body["error"];
  const errors = body["errors"];
  const candidates = [
    typeof error === "object" && error !== null ? (error as { message?: unknown }).message : error,
    Array.isArray(errors)
      ? ((errors[0] as { detail?: unknown; message?: unknown } | undefined)?.detail ??
        (errors[0] as { message?: unknown } | undefined)?.message)
      : undefined,
    body["detail"],
    body["message"],
  ];
  const found = candidates.find((value) => typeof value === "string");
  return found as string | undefined;
}

/**
 * Sends one JSON request.
 *
 * @param fetcher - `fetch`, or a test's fake.
 * @param request - `what` names the step for an error; `accept` lists the non-2xx statuses answered instead of thrown.
 * @throws RunwayUnresolvedError on any other status.
 * @example
 * const { status } = await requestJson(fetch, { what: "find project", method: "GET", url, headers, accept: [404] });
 */
export async function requestJson(
  fetcher: typeof fetch,
  request: {
    readonly what: string;
    readonly method: string;
    readonly url: string;
    readonly headers: Readonly<Record<string, string>>;
    readonly body?: unknown;
    readonly accept?: readonly number[];
  },
): Promise<JsonAnswer> {
  const response = await fetcher(request.url, {
    method: request.method,
    headers: {
      accept: "application/json",
      ...(request.body === undefined ? {} : { "content-type": "application/json" }),
      ...request.headers,
    },
    ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
  });
  const text = await response.text();
  let body: Record<string, unknown> = {};
  try {
    const value: unknown = text === "" ? {} : JSON.parse(text);
    if (typeof value === "object" && value !== null)
      body = Array.isArray(value) ? { items: value } : (value as Record<string, unknown>);
  } catch {
    body = {};
  }
  if (response.ok || request.accept?.includes(response.status) === true)
    return { status: response.status, body };
  const message = messageOf(body);
  throw new RunwayUnresolvedError(
    `${request.what}: HTTP ${response.status}${message === undefined ? "" : ` (${message})`}`,
  );
}
