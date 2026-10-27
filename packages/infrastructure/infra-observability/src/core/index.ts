/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/infra-observability until `stackra gen` writes the entry barrels
 *          (STA-339): the isomorphic half of the telemetry stack (the plan builder over the root runway and the
 *          members), its enums, error and types.
 *          Also the package's `HealthIndicator` driver (`ObservabilityHealthIndicatorDriver`) and its target, `InfraObservabilityConfig`.
 * Boundary: names each re-export and declares nothing. The zod schema of the `observability` section stays internal;
 *           the Pulumi programs are `./node`'s, because Pulumi runs under Node only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 (the infrastructure
 *                     category); ADR 0171 (decision 2).
 */
export { InfraObservabilityConfig } from "#config/infra-observability.config";
export { InfraObservabilityConfig$ } from "#core/constants/infra-observability-config-schema.constant";
export { ObservabilityHealthIndicatorDriver } from "#core/drivers/observability-health-indicator.driver";
export { HeartbeatKind } from "#core/enums/heartbeat-kind.enum";
export { SliKind } from "#core/enums/sli-kind.enum";
export { ObservabilityConfigInvalidError } from "#core/errors/observability-config-invalid.error";
export { observabilityPlan } from "#core/functions/observability-plan.function";
export type { HeartbeatSource } from "#core/types/heartbeat-source.type";
export type { ObservabilityMembers } from "#core/types/observability-members.type";
export type { ObservabilityPlan } from "#core/types/observability-plan.type";
export type { ServiceSli } from "#core/types/service-sli.type";
