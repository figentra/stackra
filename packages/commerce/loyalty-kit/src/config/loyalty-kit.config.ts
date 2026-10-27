/**
 * Stackra file contract:
 * Purpose: `LoyaltyKitConfig`, the loyalty kit's configuration (key `loyalty_kit`): the first layer of package → host →
 *          environment → runway.
 * Boundary: a configuration class over `LoyaltyKitOptions`; `env` maps the one field read from the environment to its
 *           variable. Values only; never per scope (that is settings: the earn rate, point value and redemption cap
 *           live in `LoyaltyKitSettings`) and never a secret. A custom ledger class is a
 *           host `@Replaces(LoyaltyLedger)`; runway `config.loyalty_kit.ledger` is the per-environment layer of the
 *           driver choice.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0263.
 */
import { Config } from "@stackra/config";

import { LoyaltyKitOptions } from "#core/schemas/loyalty-kit-options.schema";

/**
 * Injected by type and validated once at boot. A host overrides values in its own `src/config/loyalty-kit.config.ts`,
 * under the same name with the package class aliased.
 *
 * @example
 * import { LoyaltyKitConfig as BaseLoyaltyKitConfig } from "@stackra/loyalty-kit";
 *
 * export class LoyaltyKitConfig extends BaseLoyaltyKitConfig {
 *   override ledger = "memory" as const;
 * }
 */
export class LoyaltyKitConfig extends Config({
  schema: LoyaltyKitOptions,
  env: { ledger: "STACKRA_LOYALTY_KIT_LEDGER" },
}) {}
