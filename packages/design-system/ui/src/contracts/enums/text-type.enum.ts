/**
 * Stackra file contract:
 * Purpose: the visual styles of running text, named after the theme's type tokens (`--body`, `--small`,
 *          `--caption` in @stackra/tokens) so the token and the prop value are one word.
 * Boundary: the values only; each runtime's Text maps them to its HeroUI Typography type.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decisions 2 and 3); ADR 0165 (UI contract).
 */

/**
 * The text styles, largest first. Each has an Arabic twin in the theme (`body-ar`, …) that the renderers pick for
 * Arabic text; HeroUI v3 and HeroUI Native call them `body`, `body-sm` and `body-xs`.
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the styles carry no labels.
export const TextType = Object.freeze(["body", "small", "caption"] as const);

/** One text style. */
export type TextType = (typeof TextType)[number];
