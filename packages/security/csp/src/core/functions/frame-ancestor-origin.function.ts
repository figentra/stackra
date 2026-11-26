/**
 * Stackra file contract:
 * Purpose: `frameAncestorOrigin`, how one allowed framer becomes a `frame-ancestors` source: `self` prints `'self'`,
 *          and an origin prints as itself once it is proven to be exactly one origin.
 * Boundary: refuses (TypeError, naming the source) anything but `self` or one origin: a wildcard, a path, a default
 *           port written out, a non-http scheme, and `http:` beyond localhost. It checks static configuration and a
 *           per-request resolver's output alike. Exported, so a host refuses a stored framer (a merchant's embed origin)
 *           at write time with the same rule the header uses.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0334 rule 12.
 */
import { FRAME_ANCESTOR_PATTERN } from "#core/constants/frame-ancestor-pattern.constant";

/** The hosts a development framer may serve over plain http. */
const LOCAL_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** `source` parsed as a URL, or undefined when it does not parse. */
const parsed = (source: string): URL | undefined => {
  try {
    return new URL(source);
  } catch {
    return undefined;
  }
};

/**
 * The `frame-ancestors` source of `source`.
 *
 * @throws TypeError when `source` is not `self` or one https origin (http on localhost only).
 * @example
 * frameAncestorOrigin("https://console.pay.example"); // "https://console.pay.example"
 * frameAncestorOrigin("self"); // "'self'"
 */
export function frameAncestorOrigin(source: string): string {
  if (source === "self") return "'self'";
  const url = FRAME_ANCESTOR_PATTERN.test(source) ? parsed(source) : undefined;
  if (
    url !== undefined &&
    url.origin === source &&
    (url.protocol === "https:" || LOCAL_HOSTS.has(url.hostname))
  ) {
    return url.origin;
  }
  throw new TypeError(
    `"${source}" is not a frame ancestor: "self" or one https origin, with no wildcard`,
  );
}
