/**
 * Stackra file contract:
 * Purpose: `PrivacyOptions`, the shape of `PrivacyConfig`: which `PersonalDataStore` driver runs, how long an export
 *          link and its file live, and where exports are written on the host's `FileSystem` disk.
 * Boundary: a schema class whose field defaults match `PRIVACY_CONFIG_SCHEMA`, which it registers. Configuration, not
 *           code: a host changes the window or the folder with a config override, never an edit here.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 1); ADR 0146 as amended; ADR 0294 (decision 19); STA-1375.
 */
import "#core/types/personal-data-store-driver-names.type";

import type { DriverName } from "@stackra/container";
import { Int, registerSchemas, Schema, Str } from "@stackra/validation";

import type { PersonalDataStore } from "#contracts/ports/personal-data-store.port";
import { PRIVACY_CONFIG_SCHEMA } from "#core/constants/privacy-config-schema.constant";

/** The privacy options. */
export class PrivacyOptions extends Schema {
  /** Days an export's signed link and its file live; `PurgeSubjectExportsAction` deletes older files. 1 to 30. */
  @Int({
    min: 1,
    max: 30,
  })
  exportTtlDays = 7;

  /** The folder on the host disk exports are written to, `/`-separated, lower case. */
  @Str({
    min: 1,
    max: 200,
  })
  exportFolder = "privacy/exports";

  /** Which store driver runs; the names are the driver file prefixes (`repository`, `memory`). */
  store: DriverName<PersonalDataStore> = "repository";
}

registerSchemas([[PrivacyOptions, PRIVACY_CONFIG_SCHEMA]]);
