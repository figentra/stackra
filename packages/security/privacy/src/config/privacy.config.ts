/**
 * Stackra file contract:
 * Purpose: `PrivacyConfig`, the configuration of @stackra/privacy (key `privacy`): the store driver, the export
 *          window and the export folder.
 * Boundary: a `Config` kind over `PrivacyOptions`; the store driver is also read from `STACKRA_PRIVACY_STORE`. A host
 *           overrides it under the same name with the package class aliased.
 * Runtime: isomorphic
 * Governing contract: ADR 0146 as amended; ADR 0294 (decision 19); ADR 0189 (decision 1); STA-1375.
 */
import { Config } from "@stackra/config";

import { PrivacyOptions } from "#core/schemas/privacy-options.schema";

/**
 * The privacy configuration.
 *
 * @example
 * import { PrivacyConfig as BasePrivacyConfig } from "@stackra/privacy";
 * export class PrivacyConfig extends BasePrivacyConfig {
 *   override exportTtlDays = 3;
 * }
 */
export class PrivacyConfig extends Config({
  schema: PrivacyOptions,
  env: { store: "STACKRA_PRIVACY_STORE" },
}) {}
