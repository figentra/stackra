/**
 * Stackra file contract:
 * Purpose: `MEDIA_SCANNERS`, the driver names of the `FileScanner` port this package ships: each is its driver file's
 *          prefix (`clamav-file-scanner.driver.ts` is `clamav`).
 * Boundary: the stand-in for the names gen derives from the driver files; the shipped schema's `scanner` enum and the
 *           `DriverRegistry` entry are both read from it. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); ADR 0263 (decision 9); ADR 0354.
 */

/** The `FileScanner` drivers of this package, by name. */
export const MEDIA_SCANNERS = ["memory", "clamav", "guard_duty"] as const;
