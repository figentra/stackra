/**
 * Stackra file contract:
 * Purpose: `replayIntegrationApi(provider, exchanges)`, a managed client that answers a driver's calls from a recording,
 *          in order, so an OS connector's driver is tested against its provider's recorded API without a network.
 * Boundary: no request leaves the process and no secret is read. Each call must be the next recorded one (method, path
 *           and every request part the recording pins); any other call, or a call past the end, rejects with a
 *           `TypeError` that names the call and the differing part, never a body. A recorded refusal rejects with
 *           `ProviderRefusedError`, as the managed client would.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0443 (decision 8); owner D3 2026-10-27 (recorded fixtures,
 *                     certification pending).
 */
import { isDeepStrictEqual } from "node:util";

import { ProviderRefusedError } from "#core/index";
import type { RequestOptions } from "#core/index";
import type { RecordedExchange } from "#testing/accounting/recorded-exchange.type";
import type { ReplayedIntegrationApi } from "#testing/accounting/replayed-integration-api.type";

/** The request part of `call` that differs from `expected`, or undefined when it matches. */
function differs(
  expected: RecordedExchange,
  method: string,
  path: string,
  body: unknown,
  request: RequestOptions,
): string | undefined {
  if (expected.method !== method || expected.path !== path) return "method or path";
  if (expected.query !== undefined && !isDeepStrictEqual(expected.query, request.query ?? {}))
    return "query";
  if (expected.body !== undefined && !isDeepStrictEqual(expected.body, body)) return "body";
  if (expected.idempotencyKey !== undefined && expected.idempotencyKey !== request.idempotencyKey)
    return "idempotency key";
  return undefined;
}

/**
 * A managed client replaying `exchanges` for `provider`.
 *
 * @param provider - the provider code, named in refusals.
 * @param exchanges - the recorded calls, in the order the driver makes them.
 * @example
 * const api = replayIntegrationApi("ledger", [{ method: "GET", path: "/accounts", answer: { accounts: [] } }]);
 */
export function replayIntegrationApi(
  provider: string,
  exchanges: readonly RecordedExchange[],
): ReplayedIntegrationApi {
  let next = 0;

  /** Answers one call from the next recorded exchange. */
  async function call(
    method: string,
    path: string,
    body: unknown,
    request: RequestOptions = {},
  ): Promise<unknown> {
    const expected = exchanges[next];
    if (expected === undefined)
      throw new TypeError(
        `The ${provider} recording has no call ${next + 1} for ${method} ${path}`,
      );
    const part = differs(expected, method, path, body, request);
    if (part !== undefined)
      throw new TypeError(
        `The ${provider} recording expected ${expected.method} ${expected.path} as call ${next + 1}; ${method} ${path} differs in its ${part}`,
      );
    next += 1;
    if (expected.refusal !== undefined)
      throw ProviderRefusedError.create({
        provider,
        status: expected.refusal.status,
        ...(expected.refusal.code === undefined ? {} : { code: expected.refusal.code }),
      });
    return expected.answer;
  }

  return {
    get calls() {
      return next;
    },
    done() {
      const left = exchanges[next];
      if (left !== undefined)
        throw new TypeError(
          `The ${provider} recording was not finished: ${left.method} ${left.path} (call ${next + 1}) was never made`,
        );
    },
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
  };
}
