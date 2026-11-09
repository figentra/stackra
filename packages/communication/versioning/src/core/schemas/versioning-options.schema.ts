/**
 * Stackra file contract:
 * Purpose: `VersioningOptions`, the shape of `VersioningConfig`: the dated versions the service serves.
 * Boundary: a shape class; it registers this package's own schema (`VERSIONING_CONFIG_SCHEMA`) for itself when the
 *           module loads. With fewer than two dates the API is dormant: the generated adapter echoes the one date, if
 *           any, and never refuses a call over its version. Runway's `config.versioning` layer sets it per environment.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (API versions are dates); ADR 0294 (decisions 19 and 26).
 */
import { Field, registerSchemas, Schema } from "@stackra/validation";

import { VERSIONING_CONFIG_SCHEMA } from "#core/constants/versioning-config-schema.constant";

/** The versions a service serves. */
export class VersioningOptions extends Schema {
  /** Every `YYYY-MM-DD` version the service serves, oldest first; empty until a second version ships. */
  // reason: dates sorted without repeats is a cross-item rule that no typed decorator says; the shipped schema says it
  @Field(VERSIONING_CONFIG_SCHEMA.shape.supported)
  supported: string[] = [];
}

registerSchemas([[VersioningOptions, VERSIONING_CONFIG_SCHEMA]]);
