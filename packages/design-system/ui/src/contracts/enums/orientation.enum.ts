/**
 * Stackra file contract:
 * Purpose: the two axes a component lays out along, horizontal or vertical, as React Aria and HeroUI Native name
 *          them: separators now, tabs, toolbars, sliders and radio groups later.
 * Boundary: the values only; logical direction (start and end) is the text direction's, not this.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0304 (decision 1); WAI-ARIA 1.2 `aria-orientation`.
 */

/**
 * The orientations. Verified against `react-aria-components` 1.22.1 (`Orientation`) and `heroui-native` 1.0.10
 * (`SeparatorOrientation`).
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the values carry no labels.
export const Orientation = Object.freeze(["horizontal", "vertical"] as const);

/** One orientation. */
export type Orientation = (typeof Orientation)[number];
