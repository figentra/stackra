/**
 * Stackra file contract:
 * Purpose: `CSP_OPTIONS_SCHEMA`, the zod schema of `CspOptions` that this package ships (its `X$`): three lists of
 *          added sources, each source matching `CSP_SOURCE_PATTERN`, the report-only switch, the HSTS fields, the
 *          referrer policy and the permissions-policy allowances, with the class's defaults.
 * Boundary: the stand-in for what gen will write for this package; `buildConfig` validates the configuration with it
 *           at boot, so a source that would loosen the policy fails the boot, not a request. A permissions allowance
 *           names a baseline feature and lists `self` or host sources only (never `*`). Internal:
 *           `csp-options.schema.ts` registers it, and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0146 as amended; owner round 3 #34.
 */
import { z } from "zod";

import { CSP_SOURCE_PATTERN } from "#core/constants/csp-source-pattern.constant";
import { PERMISSIONS_POLICY_BASELINE } from "#core/constants/permissions-policy-baseline.constant";
import { REFERRER_POLICIES } from "#core/constants/referrer-policies.constant";

/** One permissions-policy source: `self` or one host source. */
const ALLOW_SOURCE = z.union([z.literal("self"), z.string().regex(CSP_SOURCE_PATTERN)]);

/** The shipped `CspOptions$`. */
export const CSP_OPTIONS_SCHEMA = z.object({
  extraConnectSrc: z.array(z.string().regex(CSP_SOURCE_PATTERN)).default(() => []),
  extraFrameSrc: z.array(z.string().regex(CSP_SOURCE_PATTERN)).default(() => []),
  extraImgSrc: z.array(z.string().regex(CSP_SOURCE_PATTERN)).default(() => []),
  reportOnly: z.boolean().default(false),
  hstsMaxAgeSeconds: z.number().int().min(0).default(63_072_000),
  hstsIncludeSubDomains: z.boolean().default(true),
  hstsPreload: z.boolean().default(false),
  referrerPolicy: z.enum(REFERRER_POLICIES).default("strict-origin-when-cross-origin"),
  permissionsAllow: z
    .partialRecord(z.enum(PERMISSIONS_POLICY_BASELINE), z.array(ALLOW_SOURCE))
    .default(() => ({})),
});
