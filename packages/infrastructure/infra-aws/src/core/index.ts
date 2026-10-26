/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/infra-aws until `stackra gen` writes the entry barrels
 *          (STA-339): the isomorphic config readers that turn a parsed root runway into the typed AWS foundation
 *          config (`awsBaselineConfig`) and the account list (`awsAccounts`), and their types.
 *          Also the package's `HealthIndicator` driver (`AwsHealthIndicatorDriver`).
 * Boundary: names each re-export and declares nothing. No Pulumi import: the programs are `./node`'s, so gen can
 *           derive and write the config without loading Pulumi.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 (the infrastructure
 *                     category).
 */
export { AwsHealthIndicatorDriver } from "#core/drivers/aws-health-indicator.driver";
export { awsAccounts } from "#core/functions/aws-accounts.function";
export { awsBaselineConfig } from "#core/functions/aws-baseline-config.function";
export type { AwsAccounts } from "#core/types/aws-accounts.type";
export type { AwsBaselineConfig } from "#core/types/aws-baseline-config.type";
export type { EnvironmentAccount } from "#core/types/environment-account.type";
