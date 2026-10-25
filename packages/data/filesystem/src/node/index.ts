/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/filesystem (the server disks: local, S3/R2, Google Cloud
 *          Storage and the Encore bucket) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: it loads `node:fs` the AWS SDK and the Google Cloud Storage client.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { EncoreBucketFileSystemDriver } from "#node/drivers/encore-bucket-file-system.driver";
export { GcsFileSystemDriver } from "#node/drivers/gcs-file-system.driver";
export { LocalFileSystemDriver } from "#node/drivers/local-file-system.driver";
export { S3FileSystemDriver } from "#node/drivers/s3-file-system.driver";
