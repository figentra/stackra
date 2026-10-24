/**
 * Stackra file contract:
 * Purpose: the side of its trigger an anchored overlay (Popover, Tooltip, Menu) opens on, named by the reading
 *          direction (start and end), so one value opens on the reading-end side in English and in Arabic.
 * Boundary: the values only; `reactAriaPlacementOf` and `physicalSideOf` turn one into each runtime's own name.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0060 (right-to-left).
 */

/** The overlay sides, logical. React Aria takes `start` and `end` as they are; HeroUI Native's are `left` and `right`. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the sides carry no labels.
export const Placement = Object.freeze(["top", "bottom", "start", "end"] as const);

/** One overlay side. */
export type Placement = (typeof Placement)[number];
