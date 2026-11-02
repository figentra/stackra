/**
 * Stackra file contract:
 * Purpose: `CrossAppConfig`, the cross-app relay configuration (key `outbox.cross_app`): the environment name, the
 *          producer's current signing key and its id, and the subscribers its relay delivers to.
 * Boundary: a configuration class over `CrossAppOptions`. The environment name comes from `STACKRA_ENVIRONMENT`;
 *           runway's `config.outbox.cross_app` layer sets the key id and the subscribers from the environment's `events`
 *           block; the signing key comes from the secret store only. A host overrides it with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12, 16 and 17, amendment of 2026-11-02); ADR 0294 (decisions 4, 19 and 20);
 *                     ADR 0146 as amended; ADR 0296 (decision 1); ADR 0173.
 */
import { Config } from "@stackra/config";

import { CrossAppOptions } from "#core/schemas/cross-app-options.schema";

/**
 * The cross-app relay configuration.
 *
 * @example
 * import { CrossAppConfig as BaseCrossAppConfig } from "@stackra/outbox";
 *
 * export class CrossAppConfig extends BaseCrossAppConfig {
 *   override environment = "staging";
 * }
 */
export class CrossAppConfig extends Config({
  schema: CrossAppOptions,
  env: { environment: "STACKRA_ENVIRONMENT" },
}) {}
