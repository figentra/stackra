/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/infra-gcp until `stackra gen` writes the entry barrels
 *          (STA-339): the isomorphic config reader that turns a parsed root runway into the typed GCP foundation
 *          config of one environment (`gcpBaselineConfig`), and its type.
 * Boundary: names each re-export and declares nothing. No Pulumi import: the programs are `./node`'s, so gen can
 *           derive and write the config without loading Pulumi.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 (the infrastructure
 *                     category); ADR 0354 (decision 3).
 */
export { gcpBaselineConfig } from "#core/functions/gcp-baseline-config.function";
export type { GcpBaselineConfig } from "#core/types/gcp-baseline-config.type";
