/**
 * Stackra file contract:
 * Purpose: `httpCall`, sends one `ClientRequest` over HTTP and reads the answer: fills the route's `:params` from the
 *          input, puts the rest in the query string (`GET`) or a JSON body, sends the caller's Idempotency-Key, the
 *          call's scope path (in the configured scope header, over the session's) and device order (`DEVICE_ORDER`
 *          headers), and resolves the answer decoded by the output schema, or rejects with the decoded refusal or a
 *          `TransportError`.
 * Boundary: internal to the HTTP transport driver and the public clients; not exported from an entry. A queued call
 *           sends `Prefer: respond-async` (RFC 7240) and reads no answer body. A query-string value that is not text,
 *           a number or a boolean is sent as JSON. A call that acts on behalf of a principal is service-to-service
 *           and never goes through this function. A caller's abort rejects with the platform's abort error.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope); ADR 0142 (transport through drivers); ADR 0138 (Idempotency-Key); ADR 0338
 *                     (decision 1: device order); ADR 0260 (2026-10-26 note: scope of a dynamic key); the HTTP
 *                     conventions rule.
 */
import { HttpMethod } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import type { ErrorEnvelope } from "@stackra/errors";
import { RequestTimedOutError, TRANSPORT_HEADERS } from "@stackra/transport";
import type { Transport } from "@stackra/transport";

import { DEVICE_ORDER } from "#contracts/constants/device-order.constant";
import { TransportFailure } from "#contracts/enums/transport-failure.enum";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { TransportError } from "#core/errors/transport.error";
import { decodeRefusal } from "#core/functions/decode-refusal.function";

/** Where and how to send. */
interface HttpCallOptions {
  /** The API origin, empty for the page's own; a trailing slash is dropped. */
  readonly baseUrl: string;

  /** The middleware-wrapped fetch. */
  readonly transport: Transport;

  /** Headers of every call (session, locale, forwarded facts). */
  readonly headers: Readonly<Record<string, string>>;

  /** The header a call's `scope` travels in; without it, a call's scope is not sent. */
  readonly scopeHeader?: string;

  /** Hand the call to the producer's queue instead of waiting for its answer. */
  readonly queue?: boolean;
}

/** A plain JSON object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Whether `body` has the required fields of an error envelope. */
function isErrorEnvelope(body: unknown): body is ErrorEnvelope {
  return (
    isRecord(body) &&
    typeof body["code"] === "string" &&
    typeof body["category"] === "string" &&
    typeof body["retryable"] === "boolean"
  );
}

/** The JSON body of `response`, or `undefined` when it has none or it is not JSON. */
async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === "") return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Sends `request` and resolves its decoded answer (`undefined` for a queued call).
 *
 * @throws TypeError when the request has no route or acts on behalf of a principal, a route param is missing, or the
 *         URL cannot be resolved (an empty base URL outside a browser).
 * @throws ClientError the producer's refusal, or a `TransportError`.
 */
export async function httpCall(request: ClientRequest, options: HttpCallOptions): Promise<unknown> {
  if (request.endpoint === undefined)
    throw new TypeError(
      `${request.key} has no HTTP route: only an in-process transport can call it`,
    );
  if (request.onBehalfOf !== undefined)
    throw new TypeError(
      `${request.key} acts on behalf of a principal: send it through a service transport`,
    );
  const { method, path } = request.endpoint;
  const fields: Readonly<Record<string, unknown>> = isRecord(request.input) ? request.input : {};
  const inPath = new Set<string>();
  const route = path.replaceAll(/:([A-Za-z][A-Za-z0-9]*)/g, (_, name: string) => {
    const value = fields[name];
    if (typeof value !== "string" && typeof value !== "number")
      throw new TypeError(`${request.key} needs "${name}" in its input for ${path}`);
    inPath.add(name);
    return encodeURIComponent(String(value));
  });
  const rest = Object.fromEntries(Object.entries(fields).filter(([name]) => !inPath.has(name)));
  const isRead = method === HttpMethod.Get;
  const query = new URLSearchParams();
  if (isRead)
    for (const [name, value] of Object.entries(rest))
      if (value !== undefined && value !== null)
        query.set(
          name,
          typeof value === "string" || typeof value === "number" || typeof value === "boolean"
            ? String(value)
            : JSON.stringify(value),
        );
  const queryString = query.toString();
  const search = queryString === "" ? "" : `?${queryString}`;
  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
  if (request.idempotencyKey !== undefined)
    headers[TRANSPORT_HEADERS.idempotencyKey] = request.idempotencyKey;
  if (request.scope !== undefined && options.scopeHeader !== undefined) {
    // The call's scope wins over the session's; header names are case-insensitive, so drop any spelling first.
    const name = options.scopeHeader.toLowerCase();
    for (const key of Object.keys(headers))
      if (key.toLowerCase() === name) Reflect.deleteProperty(headers, key);
    headers[options.scopeHeader] = request.scope;
  }
  if (request.device !== undefined) headers[DEVICE_ORDER.deviceHeader] = request.device.deviceId;
  if (request.device?.sequence !== undefined)
    headers[DEVICE_ORDER.sequenceHeader] = String(request.device.sequence);
  if (options.queue === true) headers["Prefer"] = "respond-async";
  if (!isRead) headers["Content-Type"] = "application/json";
  const body = isRead ? null : JSON.stringify(isRecord(request.input) ? rest : request.input);
  // Built before sending: a URL the platform cannot resolve is a configuration error, not a network failure.
  const outgoing = new Request(`${options.baseUrl.replace(/\/$/, "")}${route}${search}`, {
    method,
    headers,
    body,
    ...(request.signal === undefined ? {} : { signal: request.signal }),
  });

  let response: Response;
  try {
    response = await options.transport(outgoing);
  } catch (error) {
    if (request.signal?.aborted === true) throw error;
    throw TransportError.create(
      {
        reason: isRefusal(error, RequestTimedOutError)
          ? TransportFailure.Timeout
          : TransportFailure.Network,
      },
      { cause: error },
    );
  }

  const answer = await readJson(response);
  if (!response.ok) {
    if (isErrorEnvelope(answer)) throw decodeRefusal({ action: request.key, ...answer });
    throw TransportError.create({ reason: TransportFailure.Response, status: response.status });
  }
  if (options.queue === true) return undefined;
  const decoded = request.output.safeParse(answer);
  if (!decoded.success)
    throw TransportError.create(
      { reason: TransportFailure.Response, status: response.status },
      { cause: decoded.error },
    );
  return decoded.data;
}
