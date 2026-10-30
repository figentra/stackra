/**
 * Stackra file contract:
 * Purpose: `Space`, the steps of the spacing scale the layout primitives (Stack, Cluster, Grid) put between their
 *          children: none, xs (4px), sm (8px), md (16px), lg (24px), xl (32px).
 * Boundary: the values only; each runtime maps them to its gap class.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (owner request 2026-10-29, wave C).
 */

/** The spacing steps. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the steps carry no labels.
export const Space = Object.freeze(["none", "xs", "sm", "md", "lg", "xl"] as const);

/** One spacing step. */
export type Space = (typeof Space)[number];
