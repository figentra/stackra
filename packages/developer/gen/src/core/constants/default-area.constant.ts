/**
 * Stackra file contract:
 * Purpose: `DEFAULT_AREA`, the API area of an action or query that writes no `area` (`ApiArea.App` of
 *          `@stackra/actions`): its derived route starts with `/app`, and its manifest entry records `app`.
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: ADR 0082 (decision 3: four areas); ADR 0237 (decision 1: the edge routes by area); STA-340.
 */

/** The default area's code. */
export const DEFAULT_AREA = "app";
