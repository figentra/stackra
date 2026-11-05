/**
 * Stackra file contract:
 * Purpose: the payload keys that would carry a secret value; a payload holding any of them, at any depth, is refused.
 * Boundary: a constant only; carries-value.ts compares keys against it in lower case.
 * Runtime: worker
 * Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6: metadata only, never a value).
 */

/** Lower-cased key names that mean "a value is in this payload". */
export const VALUE_KEYS: ReadonlySet<string> = new Set(["value", "secretvalue", "secrets"]);
