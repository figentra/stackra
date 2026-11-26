/**
 * Stackra file contract:
 * Purpose: `SETTINGS_CONFIG_SCHEMA`, the zod schema this package ships for `SettingsConfig` (exported as
 *          `SettingsConfig$`): which `SettingValueStore` and `SettingFloorSource` drivers run.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `SettingsConfigOptions`' initializers (tested). Driver names only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0213.
 */
import { z } from "zod";

import { SETTING_FLOOR_SOURCE_DRIVERS } from "#core/constants/setting-floor-source-drivers.constant";
import { SETTING_VALUE_STORE_DRIVERS } from "#core/constants/setting-value-store-drivers.constant";

/** The shipped `SettingsConfig$`. */
export const SETTINGS_CONFIG_SCHEMA = z.object({
  store: z.enum(SETTING_VALUE_STORE_DRIVERS).default("memory"),
  floors: z.enum(SETTING_FLOOR_SOURCE_DRIVERS).default("memory"),
});
