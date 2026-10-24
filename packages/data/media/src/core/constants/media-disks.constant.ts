/**
 * Stackra file contract:
 * Purpose: `MEDIA_DISKS`, the driver names of the `MediaDisk` port this package ships: each is its driver file's prefix
 *          (`memory-media-disk.driver.ts` is `memory`).
 * Boundary: the stand-in for the names gen derives from the driver files; the shipped schema's `disk` enum and the
 *           `DriverRegistry` entry are both read from it, so the two never drift. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a config field typed `DriverName<Port>`); ADR 0263
 *                     (decision 9).
 */

/** The `MediaDisk` drivers of this package, by name. */
export const MEDIA_DISKS = ["memory", "s3"] as const;
