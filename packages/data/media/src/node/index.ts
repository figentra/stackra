/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/media (the media module: the scanners, the
 *          `sharp` image transformer, the `document` and `paddle_ocr` text extractors, the `c2pa` content credentials
 *          the `upload.create` and `upload.create_resumable` actions with their input and output, and the tus hook
 *          controller) until `stackra gen` writes the entry barrels and the generated `MediaModule` (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: it loads the AWS SDK, sharp, unpdf and c2pa-node.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note; ADR
 *                     0465 (the S3/R2 media disk is gone: media stores through `FileSystem`).
 */
export { UploadPermissions } from "#node/access/upload.permissions";
export { CreateResumableUploadAction } from "#node/actions/create-resumable-upload.action";
export { CreateUploadAction } from "#node/actions/create-upload.action";
export { C2paContentCredentialsDriver } from "#node/drivers/c2pa-content-credentials.driver";
export { ClamavFileScannerDriver } from "#node/drivers/clamav-file-scanner.driver";
export { DocumentTextExtractorDriver } from "#node/drivers/document-text-extractor.driver";
export { GuardDutyFileScannerDriver } from "#node/drivers/guard-duty-file-scanner.driver";
export { PaddleOcrTextExtractorDriver } from "#node/drivers/paddle-ocr-text-extractor.driver";
export { SharpImageTransformerDriver } from "#node/drivers/sharp-image-transformer.driver";
export { TusHookController } from "#node/raw/tus-hook.controller";
export { CreateResumableUploadOutput } from "#node/schemas/create-resumable-upload-output.schema";
export { CreateUploadInput } from "#node/schemas/create-upload-input.schema";
export { CreateUploadOutput } from "#node/schemas/create-upload-output.schema";
