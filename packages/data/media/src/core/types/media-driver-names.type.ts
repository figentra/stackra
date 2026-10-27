/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entries of the `Uploader` and `FileScanner` ports, so the `uploader` and `scanner`
 *          fields typed `DriverName<...>` and runway's `media.uploader` and `media.scanner` values take exactly this
 *          package's driver names. No `MediaDisk` entry: media stores through `FileSystem` (ADR 0465).
 * Boundary: a module augmentation only; the stand-in for the entry this package's generated wiring writes (ADR 0263
 *           decision 9). `MediaOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import type { MEDIA_SCANNERS } from "#core/constants/media-scanners.constant";
import type { MEDIA_UPLOADERS } from "#core/constants/media-uploaders.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `Uploader` (`memory`, `http`). */
    "media.Uploader": (typeof MEDIA_UPLOADERS)[number];
    /** The driver names of `FileScanner` (`memory`, `clamav`, `guard_duty`). */
    "media.FileScanner": (typeof MEDIA_SCANNERS)[number];
  }
}
