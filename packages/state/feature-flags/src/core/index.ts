/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/feature-flags (the `Flag` kind, `flagRefs`, the configuration
 *          with its shipped schema, the reader and the two `FlagProvider` drivers) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schema is re-exported under the generated name
 *           (`FeatureFlagsConfig$`) a host's generated schemas extend. The port is the `./contracts` entry's and is not
 *           re-exported here (one symbol, one entry). `FlagProviderName` carries the `DriverRegistry` augmentation, so
 *           exporting it loads the augmentation for every consumer.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { FeatureFlagsConfig } from "#config/feature-flags.config";
export { Flag } from "#core/bases/flag.base";
export { FEATURE_FLAGS_CONFIG_SCHEMA as FeatureFlagsConfig$ } from "#core/constants/feature-flags-config-schema.constant";
export { ConfigFlagProviderDriver } from "#core/drivers/config-flag-provider.driver";
export { PosthogFlagProviderDriver } from "#core/drivers/posthog-flag-provider.driver";
export { FlagTargeting } from "#core/enums/flag-targeting.enum";
export { flagRefs } from "#core/functions/flag-refs.function";
export { FeatureFlagsOptions } from "#core/schemas/feature-flags-options.schema";
export { FlagReader } from "#core/services/flag-reader.service";
export type { FlagClass } from "#core/types/flag-class.type";
export type { FlagOptions } from "#core/types/flag-options.type";
export type { FlagProviderName } from "#core/types/flag-provider-name.type";
export type { FlagRef } from "#core/types/flag-ref.type";
export type { FlagRefInput } from "#core/types/flag-ref-input.type";
export type { FlagRefs } from "#core/types/flag-refs.type";
export type { FlagScope } from "#core/types/flag-scope.type";
export type { FlagSubjects } from "#core/types/flag-subjects.type";
