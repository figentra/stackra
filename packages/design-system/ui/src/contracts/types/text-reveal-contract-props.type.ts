/**
 * Stackra file contract:
 * Purpose: `TextRevealContractProps`, the props of `TextReveal` on every runtime: a headline whose words fade in one
 *          after another.
 * Boundary: types only. The text is split on spaces only, never inside a word, so Arabic stays joined and the
 *           paragraph keeps one bidi run.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0302 (decision 3); ADR 0329 (motion layer).
 */

/** Props of `TextReveal`. */
export interface TextRevealContractProps {
  /** The text to reveal, in the app's language. */
  readonly children: string;
  /** The wait before the first word, in milliseconds. Defaults to 0. */
  readonly delay?: number | undefined;
  /** False shows the text at once. Defaults to true. */
  readonly isAnimated?: boolean | undefined;
}
