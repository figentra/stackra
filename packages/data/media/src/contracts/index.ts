/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/media (the `MediaDisk`, `FileScanner`, `ImageTransformer`,
 *          `TextExtractor` and `ContentCredentials` ports, `ScanVerdict` and the types they speak)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ScanVerdict } from "#contracts/enums/scan-verdict.enum";
export { ContentCredentials } from "#contracts/ports/content-credentials.port";
export { FileScanner } from "#contracts/ports/file-scanner.port";
export { ImageTransformer } from "#contracts/ports/image-transformer.port";
export { MediaDisk } from "#contracts/ports/media-disk.port";
export { TextExtractor } from "#contracts/ports/text-extractor.port";
export type { ContentCredential } from "#contracts/types/content-credential.type";
export type { ExtractedText } from "#contracts/types/extracted-text.type";
export type { ImageTransform } from "#contracts/types/image-transform.type";
export type { MediaObject } from "#contracts/types/media-object.type";
export type { ScanResult } from "#contracts/types/scan-result.type";
export type { SignedUpload } from "#contracts/types/signed-upload.type";
export type { UploadRequest } from "#contracts/types/upload-request.type";
