/**
 * Stackra file contract:
 * Purpose: `contentSecurityPolicy`, the policy header value of one response: the package's baseline with the
 *          request's nonce on `script-src` and `style-src`, the runtime's and the configuration's origins on
 *          `connect-src`, and the configuration's `frame-src` and `img-src` additions.
 * Boundary: additions only, each checked by `cspSource`; a fixed directive never changes, and a source appears once
 *           per directive. Pure: no clock, environment or request read. The header name is `cspHeaderName`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0251 (desktop hardening).
 */
import type { CspConfig } from "#config/csp.config";
import { CSP_BASELINE } from "#core/constants/csp-baseline.constant";
import { CSP_NONCE_PATTERN } from "#core/constants/csp-nonce-pattern.constant";
import { cspSource } from "#core/functions/csp-source.function";
import type { CspAdditions } from "#core/types/csp-additions.type";

/**
 * The policy of one response.
 *
 * @throws TypeError when the nonce is not base64, or an added source is not one host or scheme source.
 * @example
 * response.headers.set(
 *   cspHeaderName(csp),
 *   contentSecurityPolicy(csp, { connect: [env.apiUrl], nonce }),
 * );
 */
export function contentSecurityPolicy(config: CspConfig, additions: CspAdditions = {}): string {
  const { nonce } = additions;
  if (nonce !== undefined && !CSP_NONCE_PATTERN.test(nonce)) {
    throw new TypeError("the CSP nonce must be base64, as createNonce() mints it");
  }
  const nonceSources = nonce === undefined ? [] : [`'nonce-${nonce}'`];
  const added: Partial<Record<keyof typeof CSP_BASELINE, readonly string[]>> = {
    "script-src": nonceSources,
    "style-src": nonceSources,
    "connect-src": [...(additions.connect ?? []), ...config.extraConnectSrc].map(cspSource),
    "frame-src": config.extraFrameSrc.map(cspSource),
    "img-src": config.extraImgSrc.map(cspSource),
  };
  return Object.entries(CSP_BASELINE)
    .map(([directive, baseline]) => {
      const sources = new Set([
        ...baseline,
        ...(added[directive as keyof typeof CSP_BASELINE] ?? []),
      ]);
      return `${directive} ${[...sources].join(" ")}`;
    })
    .join("; ");
}
