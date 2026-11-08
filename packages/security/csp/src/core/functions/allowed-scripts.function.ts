/**
 * Stackra file contract:
 * Purpose: `allowedScripts`, the third-party script origins one response's `script-src` may carry: each configured
 *          origin whose consent category is `necessary` (a payment SDK), or one the viewer granted (`marketing` for an
 *          ad pixel), in configured order.
 * Boundary: pure. Fails closed: without the viewer's granted categories only `necessary` scripts load, and an origin
 *           the configuration does not list never does. Every origin passes `frameAncestorOrigin`'s exact-origin
 *           check. The categories are `@stackra/consent`'s `ConsentCategory` codes, passed as strings so this package
 *           does not depend on consent. Internal: `contentSecurityPolicy` calls it.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0298 (consent categories); STA-2562 frontend audit item (c).
 */
import type { CspConfig } from "#config/csp.config";
import { frameAncestorOrigin } from "#core/functions/frame-ancestor-origin.function";

/** The category that is always granted. */
const NECESSARY = "necessary";

/**
 * The script origins `consent` lets load.
 *
 * @throws TypeError when a configured origin is not exactly one origin.
 * @example
 * allowedScripts(csp, ["analytics"]); // ["https://js.stripe.com", "https://cdn.analytics.example"]
 */
export function allowedScripts(
  config: Pick<CspConfig, "thirdPartyScripts">,
  consent: readonly string[] = [],
): string[] {
  return Object.entries(config.thirdPartyScripts)
    .filter(([, category]) => category === NECESSARY || consent.includes(category))
    .map(([origin]) => frameAncestorOrigin(origin));
}
