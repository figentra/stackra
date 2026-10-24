/**
 * Stackra file contract:
 * Purpose: `FILE_SYSTEM_DISKS`, the driver names of the `FileSystem` port this package ships, in the order the README
 *          lists them: each is its driver file's prefix (`memory-file-system.driver.ts` is `memory`).
 * Boundary: the stand-in for the names gen derives from the driver files; the shipped schema's `disk` enum and the
 *           `DriverRegistry` entry are both read from it, so the two never drift. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a config field typed `DriverName<Port>`); ADR 0263
 *                     (decision 9).
 */

/** The `FileSystem` drivers of this package, by name. */
export const FILE_SYSTEM_DISKS = ["memory", "local", "s3", "encore_bucket", "electron"] as const;
