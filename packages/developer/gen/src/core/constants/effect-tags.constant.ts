/**
 * Stackra file contract:
 * Purpose: `EFFECT_TAGS`, the closed set of effect tags an action may declare in `effects`: `financial`, `security`,
 *          `pii`, `external_communication`, `irreversible` (ADR 0099 decision 2) and `bulk` (ADR 0360 decision 10).
 *          Gen copies the declared tags into the manifest and refuses any other with `effect_unknown`.
 * Boundary: a frozen list. It is risk vocabulary, not business policy: what a tag triggers (approval floors, hints)
 *           is decided by its readers. A new tag is added only by amending ADR 0099.
 * Runtime: isomorphic
 * Governing contract: ADR 0099 (decisions 2 and 3); ADR 0360 (decisions 8 and 10).
 */

/** Every effect tag, in the order ADR 0099 lists them, then the ones later ADRs add. */
export const EFFECT_TAGS: readonly string[] = Object.freeze([
  "financial",
  "security",
  "pii",
  "external_communication",
  "irreversible",
  "bulk",
]);
