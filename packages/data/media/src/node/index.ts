/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/media (the media module: the S3/R2 disk and the
 *          `upload.create` action with its input and output) until `stackra gen` writes the entry barrels and the
 *          generated `MediaModule` (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: it loads the AWS SDK.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { CreateUploadAction } from "#node/actions/create-upload.action";
export { S3MediaDiskDriver } from "#node/drivers/s3-media-disk.driver";
export { CreateUploadInput } from "#node/schemas/create-upload-input.schema";
export { CreateUploadOutput } from "#node/schemas/create-upload-output.schema";
