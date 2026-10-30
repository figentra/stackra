/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/infra-aws-runtime until `stackra gen` writes the entry
 *          barrels (STA-339): `readRuntimePlan`, which reads a repository's runways into a plan, and `awsRuntime`,
 *          which declares the plan's resources inside a Pulumi program, `awsRuntimeStack`, the stack one service
 *          deploys through, `ensureDatabasePasswords` and `publishResourceSecrets` for the resource secrets (ADR 0493),
 *          with their option and result types.
 * Boundary: names each re-export and declares nothing. Node only: it reads files and loads Pulumi. Imports `.`
 *           internals one way (ADR 0294 decision 15); exports none of `.`'s symbols.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0171 (decision 3).
 */
export { awsRuntime } from "#node/functions/aws-runtime.function";
export { awsRuntimeStack } from "#node/functions/aws-runtime-stack.function";
export { ensureDatabasePasswords } from "#node/functions/ensure-database-passwords.function";
export { publishResourceSecrets } from "#node/functions/publish-resource-secrets.function";
export { readRuntimePlan } from "#node/functions/read-runtime-plan.function";
export type { AwsRuntime } from "#node/types/aws-runtime.type";
export type { AwsRuntimeOptions } from "#node/types/aws-runtime-options.type";
