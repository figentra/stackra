/**
 * Stackra file contract:
 * Purpose: `MEDIA_UPLOADERS`, the driver names of the `Uploader` port this package ships: each is its driver file's
 *          prefix (`http-uploader.driver.ts` is `http`).
 * Boundary: the stand-in for the names gen derives from the driver files; the shipped schema's `uploader` enum and the
 *           `DriverRegistry` entry are both read from it. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); ADR 0263 (decision 9).
 */

/** The `Uploader` drivers of this package, by name. */
export const MEDIA_UPLOADERS = ["memory", "http"] as const;
