/**
 * Stackra file contract:
 * Purpose: `toFetchRequest`, the one reading of a guest `fetch(url, init)` every engine shares: the URL's
 *          origin must be in the run's allow-list, and `init` may carry only a string method, an object of string
 *          headers and a string body.
 * Boundary: internal to @stackra/sandbox (not in a barrel); plain values in, a `SandboxFetchRequest` out. The JavaScript
 *           engine passes what it read from the guest, and the Python engine what its `fetch` sent as JSON.
 * Runtime: isomorphic
 * Governing contract: ADR 0154 (decision 5: egress only through the allow-listed proxy); ADR 0434 (decisions 1 and 2).
 */
import type { SandboxFetchRequest } from "#contracts/index";
import { originOf } from "#core/functions/origin-of.function";

/**
 * The request a guest `fetch(url, options)` asks for.
 *
 * @example
 * toFetchRequest("https://api.example.com/a", { method: "post" }, new Set(["https://api.example.com"]));
 * @throws TypeError when the arguments are malformed or the origin is not in `origins`.
 */
export function toFetchRequest(
  url: unknown,
  options: unknown,
  origins: ReadonlySet<string>,
): SandboxFetchRequest {
  if (typeof url !== "string") throw new TypeError("fetch: the URL is a string");
  const origin = URL.canParse(url) ? originOf(url) : undefined;
  if (origin === undefined || !origins.has(origin))
    throw new TypeError(`fetch: ${origin ?? url} is not an allowed origin`);
  if (options !== undefined && (typeof options !== "object" || options === null))
    throw new TypeError("fetch: the options are an object");
  const { method = "GET", headers = {}, body } = (options ?? {}) as Record<string, unknown>;
  if (typeof method !== "string") throw new TypeError("fetch: the method is a string");
  if (
    typeof headers !== "object" ||
    headers === null ||
    Object.values(headers).some((value) => typeof value !== "string")
  )
    throw new TypeError("fetch: the headers are an object of strings");
  if (body !== undefined && typeof body !== "string")
    throw new TypeError("fetch: the body is a string");
  return {
    url,
    method: method.toUpperCase(),
    headers: headers as Record<string, string>,
    ...(body === undefined ? {} : { body }),
  };
}
