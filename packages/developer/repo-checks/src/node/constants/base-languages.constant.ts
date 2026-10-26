/**
 * Stackra file contract:
 * Purpose: `BASE_LANGUAGES`, the seven base languages every release ships; `en` is the source of every catalogue.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0403.
 */

/** The seven base languages every release ships (ADR 0403); `en` is the source of every catalogue. */
export const BASE_LANGUAGES: readonly string[] = ["ar", "en", "fr", "de", "es", "it", "nl"];
