/**
 * Stackra file contract:
 * Purpose: `LockingConfig`, the locking configuration (key `locking`): the `driver` choice runway sets per environment
 *          (`postgres` by default, `memory` for a test or a single process).
 * Boundary: a configuration class over `LockingOptions` with no env map; runway's `config.locking` layer sets it. A
 *           host overrides it as `class LockingConfig extends BaseLockingConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended; ADR 0296 (decision 1); ADR 0149
 *                     (decision 1).
 */
import { Config } from "@stackra/config";

import { LockingOptions } from "#core/schemas/locking-options.schema";

/**
 * The locking configuration.
 *
 * @example
 * import { LockingConfig as BaseLockingConfig } from "@stackra/locking";
 *
 * export class LockingConfig extends BaseLockingConfig {
 *   override driver: DriverName<LockDriver> = "memory";
 * }
 */
export class LockingConfig extends Config({ schema: LockingOptions }) {}
