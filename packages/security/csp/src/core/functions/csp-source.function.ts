/**
 * Stackra file contract:
 * Purpose: `cspSource`, how one added source becomes a source expression: a URL with an authority
 *          (`https://api.acme.com/v1`, `wss://rt.acme.com/socket`, `app://bundle`) counts by its scheme and host, so an
 *          env value with a path still allows its whole origin; any other source is kept as written.
 * Boundary: refuses (TypeError) a source outside `CSP_SOURCE_PATTERN`, naming it; sources are deploy-time values,
 *           never secrets. Internal: `contentSecurityPolicy` calls it, and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers).
 */
import { CSP_SOURCE_PATTERN } from "#core/constants/csp-source-pattern.constant";

/**
 * The source expression of `source`.
 *
 * @throws TypeError when `source` is not one host or scheme source, or is a URL that does not parse.
 * @example
 * cspSource("https://api.acme.com/v1"); // "https://api.acme.com"
 * cspSource("*.acme.com"); // "*.acme.com"
 */
export function cspSource(source: string): string {
  if (!CSP_SOURCE_PATTERN.test(source)) {
    throw new TypeError(`"${source}" is not a CSP host or scheme source`);
  }
  if (!source.includes("://")) return source;
  try {
    const url = new URL(source);
    return `${url.protocol}//${url.host}`;
  } catch {
    throw new TypeError(`"${source}" is not a valid URL source`);
  }
}
