/**
 * Stackra file contract:
 * Purpose: `ConsentConfig`, the configuration of @stackra/consent (key `consent`): the categories, the decision cookie,
 *          the policy version, the regional defaults and the first-launch prompt, read by the `ConsentLedger`, the
 *          store drivers and the host's banner or settings page.
 * Boundary: the class is the DI token; it has no env map (consent is decided in the client, never by deploy-time
 *           values). A host overrides it under the same name, with this class aliased `BaseConsentConfig`, by
 *           `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0298 (decisions 1 to 4).
 */
import { Config } from "@stackra/config";

import { ConsentOptions } from "#core/schemas/consent-options.schema";

/**
 * Visitor consent settings.
 *
 * @example
 * import { ConsentCategory, ConsentConfig as BaseConsentConfig } from "@stackra/consent";
 *
 * export class ConsentConfig extends BaseConsentConfig {
 *   override categories: BaseConsentConfig["categories"] = [
 *     { category: ConsentCategory.Necessary, required: true, defaultGranted: true, descriptionKey: null },
 *     { category: ConsentCategory.Analytics, required: false, defaultGranted: false, descriptionKey: null },
 *   ];
 *   override policyVersion = "2026-10";
 * }
 */
export class ConsentConfig extends Config({ schema: ConsentOptions }) {}
