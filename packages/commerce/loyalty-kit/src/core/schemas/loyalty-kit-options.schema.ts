/**
 * Stackra file contract:
 * Purpose: `LoyaltyKitOptions`, the shape of the loyalty kit's configuration: field types are the rules, initializers
 *          the package defaults.
 * Boundary: a shape class, the `schema` of `LoyaltyKitConfig`; it registers this package's own schema
 *           (`LOYALTY_KIT_CONFIG_SCHEMA`) for itself when the module loads, so `buildConfig(LoyaltyKitConfig)`
 *           validates with no generated file. Deploy-time values only; anything a scope tunes is a setting: the earn
 *           rate, the point value and the redemption cap are `LoyaltyKitSettings` fields (ADR 0454, STA-1323), never
 *           config. The ledger driver is a `DriverName<LoyaltyLedger>` field, so a typo is a type error;
 *           `LoyaltyMembers` has no field, because a port with one candidate needs no selector.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0146 as amended; ADR 0263; ADR 0454 (decision 2).
 */
import "#core/types/loyalty-ledger-driver-names.type";

import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import type { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import { LOYALTY_KIT_CONFIG_SCHEMA } from "#core/constants/loyalty-kit-config-schema.constant";

/**
 * Every option the kit reads; a host changes values in its config override, never here.
 *
 * @example
 * export class LoyaltyKitConfig extends BaseLoyaltyKitConfig {
 *   override ledger = "memory" as const;
 * }
 */
export class LoyaltyKitOptions extends Schema {
  /** Which ledger driver runs; names are the driver file prefixes (`postgres`, `memory`). */
  ledger: DriverName<LoyaltyLedger> = "postgres";

  /**
   * Named instances for a host that runs two ledgers while migrating drivers, each injected as
   * `Named<LoyaltyLedger, "primary">`; empty by default.
   */
  ledgers: Record<string, DriverName<LoyaltyLedger>> = {};
}

registerSchemas([[LoyaltyKitOptions, LOYALTY_KIT_CONFIG_SCHEMA]]);
