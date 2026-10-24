/**
 * Stackra file contract:
 * Purpose: `CSP_OPTIONS_SCHEMA`, the zod schema of `CspOptions` that this package ships (its `X$`): three lists of
 *          added sources, each source matching `CSP_SOURCE_PATTERN`, and the report-only switch, with the class's
 *          defaults.
 * Boundary: the stand-in for what gen will write for this package; `buildConfig` validates the configuration with it
 *           at boot, so a source that would loosen the policy fails the boot, not a request. Internal:
 *           `csp-options.schema.ts` registers it, and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0146 as amended.
 */
import { z } from "zod";

import { CSP_SOURCE_PATTERN } from "#core/constants/csp-source-pattern.constant";

/** The shipped `CspOptions$`. */
export const CSP_OPTIONS_SCHEMA = z.object({
  extraConnectSrc: z.array(z.string().regex(CSP_SOURCE_PATTERN)).default(() => []),
  extraFrameSrc: z.array(z.string().regex(CSP_SOURCE_PATTERN)).default(() => []),
  extraImgSrc: z.array(z.string().regex(CSP_SOURCE_PATTERN)).default(() => []),
  reportOnly: z.boolean().default(false),
});
