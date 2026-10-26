/**
 * Stackra file contract:
 * Purpose: `CurrentState`: how an entry stands to the current place.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3: the same output on
 *          web and native); ADR 0317 (decisions 1 and 3); WCAG 2.2 SC 1.3.1 and 4.1.2.
 */
/** How an entry stands to the current place. */
export type CurrentState = "page" | "ancestor" | "none";
