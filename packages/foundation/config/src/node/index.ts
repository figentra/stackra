/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/config (the AWS Secrets Manager secret store and the AWS SDK KMS client) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: the driver loads the AWS SDK, an optional peer a
 *           host installs when it binds this driver.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision.
 */
export { AwsSdkKmsClientDriver } from "#node/drivers/aws-sdk-kms-client.driver";
export { AwsSecretsManagerSecretStoreDriver } from "#node/drivers/aws-secrets-manager-secret-store.driver";
