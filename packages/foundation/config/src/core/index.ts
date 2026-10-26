/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/config, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339). The old `./env` entry is folded in (owner Q4).
 * Boundary: names each re-export and declares nothing. `MigrationRunner` is @stackra/contracts' (owner Q2). The
 *           layering internals (`layerConfig`, `sealConfig`, `configRoot`) stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { AwsSecretsManagerConfig } from "#config/aws-secrets-manager.config";
export { InfisicalConfig } from "#config/infisical.config";
export { Config } from "#core/bases/config.base";
export { AWS_SECRETS_MANAGER_CONFIG_SCHEMA as AwsSecretsManagerConfig$ } from "#core/constants/aws-secrets-manager-config-schema.constant";
export { env } from "#core/constants/env.constant";
export { INFISICAL_CONFIG_SCHEMA as InfisicalConfig$ } from "#core/constants/infisical-config-schema.constant";
export { Secret } from "#core/decorators/secret.decorator";
export { InfisicalSecretStoreDriver } from "#core/drivers/infisical-secret-store.driver";
export { MemorySecretStoreDriver } from "#core/drivers/memory-secret-store.driver";
export { ConfigInvalidError } from "#core/errors/config-invalid.error";
export { buildConfig } from "#core/functions/build-config.function";
export { configKey } from "#core/functions/config-key.function";
export { hydrateEnv } from "#core/functions/hydrate-env.function";
export { AwsSecretsManagerOptions } from "#core/schemas/aws-secrets-manager-options.schema";
export { InfisicalOptions } from "#core/schemas/infisical-options.schema";
export type { BuildFacts } from "#core/types/build-facts.type";
export type { ConfigClass } from "#core/types/config-class.type";
export type { ConfigIssue } from "#core/types/config-issue.type";
export type { ConfigLayers } from "#core/types/config-layers.type";
export type { ConfigOptions } from "#core/types/config-options.type";
export type { ConfigValues } from "#core/types/config-values.type";
export type { EnvDerivations } from "#core/types/env-derivations.type";
export type { EnvMap } from "#core/types/env-map.type";
export type { EnvValue } from "#core/types/env-value.type";
export type { PublicPart } from "#core/types/public-part.type";
