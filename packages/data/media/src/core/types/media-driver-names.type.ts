/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entries of the `MediaDisk` and `Uploader` ports, so the `disk` and `uploader` fields
 *          typed `DriverName<...>` and runway's `media.disk` and `media.uploader` values take exactly this package's
 *          driver names.
 * Boundary: a module augmentation only; the stand-in for the entry this package's generated wiring writes (ADR 0263
 *           decision 9). `MediaOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import type { MEDIA_DISKS } from "#core/constants/media-disks.constant";
import type { MEDIA_UPLOADERS } from "#core/constants/media-uploaders.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `MediaDisk` (`memory`, `s3`). */
    "media.MediaDisk": (typeof MEDIA_DISKS)[number];
    /** The driver names of `Uploader` (`memory`, `http`). */
    "media.Uploader": (typeof MEDIA_UPLOADERS)[number];
  }
}
