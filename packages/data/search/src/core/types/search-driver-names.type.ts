/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of the `SearchDriver` port, so the `driver` field typed `DriverName<SearchDriver>`
 *          and a runway `search.driver` value take exactly this package's driver names.
 * Boundary: a module augmentation only; the stand-in for the entry this package's generated wiring writes (ADR 0263
 *           decision 9). `SearchOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import type { SEARCH_DRIVERS } from "#core/constants/search-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `SearchDriver` (`postgres`, `memory`). */
    "search.SearchDriver": (typeof SEARCH_DRIVERS)[number];
  }
}
