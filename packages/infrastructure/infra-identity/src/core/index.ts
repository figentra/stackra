/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/infra-identity until `stackra gen` writes the entry barrels
 *          (STA-339): the seed check, the plan of one ZITADEL instance, their enums, error and types.
 *          Also the package's `HealthIndicator` driver (`IdentityHealthIndicatorDriver`) and its target, `InfraIdentityConfig`.
 * Boundary: names each re-export and declares nothing. Isomorphic: no Pulumi and no Node import, so `stackra infra
 *           gen` and `stackra dev` can check the seed and build the plan anywhere; reading the seed file and the
 *           Pulumi slice are `./node`'s. The zod schemas stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 (the infrastructure
 *                     category and its entries).
 */
export { InfraIdentityConfig } from "#config/infra-identity.config";
export { InfraIdentityConfig$ } from "#core/constants/infra-identity-config-schema.constant";
export { IdentityHealthIndicatorDriver } from "#core/drivers/identity-health-indicator.driver";
export { IdentityAppKind } from "#core/enums/identity-app-kind.enum";
export { InstanceRole } from "#core/enums/instance-role.enum";
export { IdentityInfraInvalidError } from "#core/errors/identity-infra-invalid.error";
export { identityPlan } from "#core/functions/identity-plan.function";
export { parseIdentitySeed } from "#core/functions/parse-identity-seed.function";
export type { IdentityPlan } from "#core/types/identity-plan.type";
export type { IdentityPlanApp } from "#core/types/identity-plan-app.type";
export type { IdentitySeed } from "#core/types/identity-seed.type";
