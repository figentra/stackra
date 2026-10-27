/**
 * Stackra file contract:
 * Purpose: `CspOptions`, the fields of `CspConfig`: the sources a host adds to `connect-src`, `frame-src` and
 *          `img-src`, whether the policy is sent report-only, and the other security headers every response carries
 *          (HSTS, the referrer policy and the features the permissions policy allows).
 * Boundary: a plain shape class with defaults (no additions, enforcing, HSTS on for two years with subdomains, a strict
 *           referrer policy, every baseline feature off). Additions only: there is no field for `script-src` or
 *           `style-src` (both are nonce-based) or for any fixed directive or header. It registers this package's own
 *           schema for itself when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0237 (edge headers); owner round 3 #34.
 */
import { Field, Int, registerSchemas, Schema } from "@stackra/validation";

import { CSP_OPTIONS_SCHEMA } from "#core/constants/csp-options-schema.constant";
import type { PermissionsFeature } from "#core/types/permissions-feature.type";
import type { ReferrerPolicy } from "#core/types/referrer-policy.type";

/**
 * What a host adds to the baseline policy and headers.
 *
 * @example
 * export class CspConfig extends Config({ schema: CspOptions }) {}
 */
export class CspOptions extends Schema {
  /** `Strict-Transport-Security` max-age in seconds; `0` tells browsers to forget an earlier HSTS answer. */
  @Int({
    min: 0,
  })
  hstsMaxAgeSeconds = 63_072_000;

  /** The `Referrer-Policy` header. */
  // reason: a closed set of header tokens kept as a string-literal union, with no `X$`
  @Field(CSP_OPTIONS_SCHEMA.shape.referrerPolicy)
  referrerPolicy: ReferrerPolicy = "strict-origin-when-cross-origin";

  /** Baseline features the host turns back on, each with its sources (`{ camera: ["self"] }` for a till's scanner). */
  // reason: a partial record keyed by feature name; the shipped schema checks each source
  @Field(CSP_OPTIONS_SCHEMA.shape.permissionsAllow)
  permissionsAllow: Partial<Record<PermissionsFeature, string[]>> = {};

  /** `connect-src` additions beyond the origins the runtime passes (the API gateway, realtime). */
  extraConnectSrc: string[] = [];

  /** `frame-src` additions, such as a captcha widget's origin. */
  extraFrameSrc: string[] = [];

  /** `img-src` additions, such as the media CDN; the document head also preconnects to them. */
  extraImgSrc: string[] = [];

  /** Send `Content-Security-Policy-Report-Only`: violations are reported and nothing is blocked. */
  reportOnly = false;

  /** HSTS covers every subdomain of the host too. */
  hstsIncludeSubDomains = true;

  /** Ask to be in the browsers' HSTS preload list; only once every subdomain serves HTTPS. */
  hstsPreload = false;
}

registerSchemas([[CspOptions, CSP_OPTIONS_SCHEMA]]);
