/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/infra-gcp until `stackra gen` writes the entry barrels
 *          (STA-339): the isomorphic config readers that turn a parsed root runway into the typed GCP foundation and
 *          runtime configs of one deployment (`gcpBaselineConfig`, `gcpRuntimeConfig`), the service account id guard,
 *          the GCP health indicator driver, and their types.
 * Boundary: names each re-export and declares nothing. No Pulumi import: the programs are `./node`'s, so gen can
 *           derive and write the config without loading Pulumi.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 (the infrastructure
 *                     category); ADR 0354 (decision 3).
 */
export { InfraGcpConfig } from "#config/infra-gcp.config";
export { InfraGcpConfig$ } from "#core/constants/infra-gcp-config-schema.constant";
export { GcpHealthIndicatorDriver } from "#core/drivers/gcp-health-indicator.driver";
export { gcpBaselineConfig } from "#core/functions/gcp-baseline-config.function";
export { gcpRuntimeConfig } from "#core/functions/gcp-runtime-config.function";
export { serviceAccountId } from "#core/functions/service-account-id.function";
export type { GcpBaselineConfig } from "#core/types/gcp-baseline-config.type";
export type { GcpDeployment } from "#core/types/gcp-deployment.type";
export type { GcpRuntimeConfig } from "#core/types/gcp-runtime-config.type";
