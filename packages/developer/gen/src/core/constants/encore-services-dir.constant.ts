/**
 * Stackra file contract:
 * Purpose: `ENCORE_SERVICES_DIR`, the folder at a service's root that holds its generated Encore services
 *          (`stackra-encore/<member>/`), beside `encore.app`. It sits outside `.stackra` because Encore skips dot
 *          folders when it discovers services; its imports still reach `.stackra/entry` and `.stackra/gen`.
 * Boundary: a constant string; gitignored and owned by gen, like `.stackra`. Nobody writes a file there by hand.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2 as amended 2026-11-10); ADR 0124 (no hand-written Encore).
 */

/** The folder of a service's generated Encore services, relative to the member root. */
export const ENCORE_SERVICES_DIR = "stackra-encore";
