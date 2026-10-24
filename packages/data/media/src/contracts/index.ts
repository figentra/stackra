/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/media (the `MediaDisk` port and the types it speaks)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { MediaDisk } from "#contracts/ports/media-disk.port";
export type { MediaObject } from "#contracts/types/media-object.type";
export type { SignedUpload } from "#contracts/types/signed-upload.type";
export type { UploadRequest } from "#contracts/types/upload-request.type";
