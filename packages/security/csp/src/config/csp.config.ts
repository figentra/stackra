/**
 * Stackra file contract:
 * Purpose: `CspConfig`, the configuration of @stackra/csp (key `csp`): the host's additions to the baseline policy
 *          and its rollout mode, read by the generated server middleware and the Electron main when they set the
 *          policy header, and by the document head for its image preconnects.
 * Boundary: the class is the DI token. A host overrides it under the same name, with this class aliased
 *           `BaseCspConfig`, by `override` members only; the baseline and its fixed directives stay the package's.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0237 (edge headers); ADR 0251.
 */
import { Config } from "@stackra/config";

import { CspOptions } from "#core/schemas/csp-options.schema";

/**
 * The policy additions and the report-only switch.
 *
 * @example
 * import { CspConfig as BaseCspConfig } from "@stackra/csp";
 *
 * export class CspConfig extends BaseCspConfig {
 *   override extraFrameSrc: string[] = ["https://challenges.cloudflare.com"];
 *   override reportOnly = true;
 * }
 */
export class CspConfig extends Config({ schema: CspOptions }) {}
