/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/infra-aws until `stackra gen` writes the entry barrels
 *          (STA-339): the Pulumi programs (`awsBaseline` per environment, `stateBackend` for the tooling account,
 *          `backupAccount` for the backup account), the `ref:` resolver and their output types.
 * Boundary: names each re-export and declares nothing. Node only: it loads Pulumi. The building blocks (keys, buckets,
 *           roles, budgets) stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0171 (decision 2).
 */
export { awsBaseline } from "#node/functions/aws-baseline.function";
export { backupAccount } from "#node/functions/backup-account.function";
export { resolveRef } from "#node/functions/resolve-ref.function";
export { stateBackend } from "#node/functions/state-backend.function";
export type { AwsBaselineOutputs } from "#node/types/aws-baseline-outputs.type";
export type { BackupAccountOutputs } from "#node/types/backup-account-outputs.type";
export type { StateBackendOutputs } from "#node/types/state-backend-outputs.type";
