/**
 * Stackra file contract:
 * Purpose: the semantic tones a component is coloured by, named as HeroUI's colour roles so a tone renders to its
 *          role (`--accent`, `--danger`, …) with no mapping.
 * Boundary: the values only; the colours live in the theme (@stackra/tokens).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract).
 */

/**
 * The tones. Verified against the `color` variants of `@heroui/styles` 3.2.6 (`chip.styles`) and `heroui-native`
 * 1.0.10 (`ChipColor`).
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the tones carry no labels.
export const Tone = Object.freeze(["default", "accent", "success", "warning", "danger"] as const);

/** One semantic tone. */
export type Tone = (typeof Tone)[number];
