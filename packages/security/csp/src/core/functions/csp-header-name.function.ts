/**
 * Stackra file contract:
 * Purpose: `cspHeaderName`, the header the policy is sent under: `Content-Security-Policy-Report-Only` while the
 *          configuration rolls the policy out report-only, `Content-Security-Policy` once it enforces.
 * Boundary: reads `reportOnly` only. Pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers).
 */
import type { CspConfig } from "#config/csp.config";

/**
 * The header name for `config`'s mode.
 *
 * @example
 * response.headers.set(cspHeaderName(csp), contentSecurityPolicy(csp, { nonce }));
 */
export function cspHeaderName(
  config: Pick<CspConfig, "reportOnly">,
): "Content-Security-Policy" | "Content-Security-Policy-Report-Only" {
  return config.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
}
