/**
 * Stackra file contract:
 * Purpose: `PromptPaint`, what an interactive prompter draws with: the run's painter and symbols, so prompts take
 *          the product's accent and fall back to ASCII like every other component.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-024.
 */
import type { SYMBOLS } from "#core/constants/symbols.constant";
import type { Painter } from "#core/types/painter.type";

/** How prompts are drawn in this run. */
export interface PromptPaint {
  /** The run's colours. */
  readonly painter: Painter;

  /** Puts right-to-left text in the order this terminal needs (identity unless the mode is visual). */
  readonly bidi: (text: string) => string;

  /** The run's symbols (Unicode or ASCII). */
  readonly symbols: (typeof SYMBOLS)["unicode"];
}
