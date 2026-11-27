/**
 * Stackra file contract:
 * Purpose: `browserLogRefusal(method, headers)`, why the dev server refuses a browser report, or undefined when it
 *          takes it: only a `POST` (405), with the client's `x-stackra-browser-log: 1` header (403), from the page's
 *          own origin (403 for a `Sec-Fetch-Site` other than `same-origin`, or an `Origin` whose host is not the
 *          request's `Host`), with a JSON body (415). A cross-site page cannot send the custom header without a CORS
 *          preflight the dev server never answers, so only the dev server's own pages write to the dev log.
 * Boundary: pure; reads the method and headers only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); STA-2889.
 */

/** A refusal: the HTTP status and the reason. */
type Refusal = { readonly status: number; readonly reason: string };

/** A header's single value. */
const one = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * Why a browser report is refused, if it is.
 *
 * @param method - the request method.
 * @param headers - the request headers, lower-case names.
 * @example
 * browserLogRefusal("GET", {}); // { status: 405, reason: "POST only" }
 */
export function browserLogRefusal(
  method: string | undefined,
  headers: Readonly<Record<string, string | string[] | undefined>>,
): Refusal | undefined {
  if (method !== "POST") return { status: 405, reason: "POST only" };
  if (one(headers["x-stackra-browser-log"]) !== "1")
    return { status: 403, reason: "not the dev server's browser log client" };
  const site = one(headers["sec-fetch-site"]);
  if (site !== undefined && site !== "same-origin")
    return { status: 403, reason: `a ${site} page cannot write the dev log` };
  const origin = one(headers["origin"]);
  if (origin !== undefined) {
    let host: string | undefined;
    try {
      host = new URL(origin).host;
    } catch {
      host = undefined;
    }
    if (host === undefined || host !== one(headers["host"]))
      return { status: 403, reason: "another origin cannot write the dev log" };
  }
  if (!(one(headers["content-type"]) ?? "").toLowerCase().startsWith("application/json"))
    return { status: 415, reason: "JSON only" };
  return undefined;
}
