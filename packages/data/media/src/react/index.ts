/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/media (`useUpload` and `useImageVariant`) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { useImageVariant } from "#react/image-variant/use-image-variant";
export { useUpload } from "#react/upload/use-upload";
