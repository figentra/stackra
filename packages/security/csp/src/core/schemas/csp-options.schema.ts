/**
 * Stackra file contract:
 * Purpose: `CspOptions`, the fields of `CspConfig`: the sources a host adds to `connect-src`, `frame-src` and
 *          `img-src`, and whether the policy is sent report-only.
 * Boundary: a plain shape class with defaults (no additions, enforcing). Additions only: there is no field for
 *           `script-src` or `style-src` (both are nonce-based) or for any fixed directive. It registers this
 *           package's own schema for itself when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0237 (edge headers).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { CSP_OPTIONS_SCHEMA } from "#core/constants/csp-options-schema.constant";

/**
 * What a host adds to the baseline policy.
 *
 * @example
 * export class CspConfig extends Config({ schema: CspOptions }) {}
 */
export class CspOptions extends Schema {
  /** `connect-src` additions beyond the origins the runtime passes (the API gateway, realtime). */
  extraConnectSrc: string[] = [];

  /** `frame-src` additions, such as a captcha widget's origin. */
  extraFrameSrc: string[] = [];

  /** `img-src` additions, such as the media CDN; the document head also preconnects to them. */
  extraImgSrc: string[] = [];

  /** Send `Content-Security-Policy-Report-Only`: violations are reported and nothing is blocked. */
  reportOnly = false;
}

registerSchemas([[CspOptions, CSP_OPTIONS_SCHEMA]]);
