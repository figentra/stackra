/**
 * Stackra file contract:
 * Purpose: `RUNWAY_FACTS_GLOBAL`, the identifier `definesFor` defines with one member's resolved runway facts and the
 *          `.` readers look for before any file: `__STACKRA_RUNWAY__`.
 * Boundary: internal; must equal the identifier the core facts reader declares.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: generated tool configs), ADR 0254 (the feed in a packaged build).
 */

/** The bundler `define` key of the injected facts. */
export const RUNWAY_FACTS_GLOBAL = "__STACKRA_RUNWAY__";
