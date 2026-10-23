/**
 * Stackra file contract:
 * Purpose: the colours foreground content is set in (Text, Heading and Icon): the shared tones (default,
 *          accent, success, warning, danger) plus `muted` for secondary copy.
 * Boundary: the values only; the colours are the theme's roles (`--muted`, `--danger`, …) in @stackra/tokens.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decisions 2 and 3); ADR 0303 (decision 7); ADR 0165 (UI contract).
 */

/**
 * The text tones. `default` and `muted` are HeroUI Typography's `color` values on both runtimes; the others are the
 * theme's colour utilities. Each passes WCAG AA as text on `background` and `surface` in the stackra theme.
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the tones carry no labels.
export const TextTone = Object.freeze([
  "default",
  "muted",
  "accent",
  "success",
  "warning",
  "danger",
] as const);

/** One text tone. */
export type TextTone = (typeof TextTone)[number];
