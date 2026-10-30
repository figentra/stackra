/**
 * Stackra file contract:
 * Purpose: `awaitOperation(fetcher, request)`, waits for one Google long-running operation (Resource Manager, Service
 *          Usage, Firebase) to finish and answers its `response` or its `error`.
 * Boundary: polls `<base>/<name>` every `intervalMs` (default 2 s) up to `attempts` times (default 60), then throws
 *           naming the operation. Never logs the answer.
 * Runtime: node
 * Governing contract: ADR 0482 (decision 5).
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { requestJson } from "#node/functions/request-json.function";

/**
 * The finished operation's outcome.
 *
 * @throws RunwayUnresolvedError when it does not finish in time, or a poll fails.
 * @example
 * const { response } = await awaitOperation(fetch, { base, name: "operations/abc", headers, what: "create project" });
 */
export async function awaitOperation(
  fetcher: typeof fetch,
  request: {
    readonly what: string;
    readonly base: string;
    readonly name: string;
    readonly headers: Readonly<Record<string, string>>;
    readonly intervalMs?: number;
    readonly attempts?: number;
  },
): Promise<{
  readonly response?: Record<string, unknown>;
  readonly error?: Record<string, unknown>;
}> {
  const attempts = request.attempts ?? 60;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { body } = await requestJson(fetcher, {
      what: request.what,
      method: "GET",
      url: `${request.base}/${request.name}`,
      headers: request.headers,
    });
    if (body["done"] === true)
      return {
        ...(typeof body["response"] === "object"
          ? { response: body["response"] as Record<string, unknown> }
          : {}),
        ...(typeof body["error"] === "object"
          ? { error: body["error"] as Record<string, unknown> }
          : {}),
      };
    await new Promise((settle) => {
      setTimeout(settle, request.intervalMs ?? 2000);
    });
  }
  throw new RunwayUnresolvedError(`${request.what}: ${request.name} did not finish`);
}
