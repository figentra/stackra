/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of the `FileSystem` port, so the `disk` field typed `DriverName<FileSystem>`
 *          and a runway `filesystem.disk` value take exactly this package's driver names.
 * Boundary: a module augmentation only; the stand-in for the entry this package's generated wiring writes (ADR 0263
 *           decision 9). `FilesystemOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import type { FILE_SYSTEM_DISKS } from "#core/constants/file-system-disks.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `FileSystem` (`memory`, `local`, `s3`, `gcs`, `encore_bucket`, `electron`, `expo`). */
    "filesystem.FileSystem": (typeof FILE_SYSTEM_DISKS)[number];
  }
}
