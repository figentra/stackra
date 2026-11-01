/**
 * Stackra file contract:
 * Purpose: `createPainter(depth, accent)`, the `Painter` of a run: SGR sequences at the decided depth, closed with
 *          the matching reset so nested colours stay intact; plain text at depth 0.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-020 and FR-021.
 */
import { STATUS_COLOURS } from "#core/constants/status-colours.constant";
import { colourEscape } from "#core/functions/colour-escape.function";
import type { ConsoleMode } from "#core/types/console-mode.type";
import type { Painter } from "#core/types/painter.type";

/** The painter for `depth`, with `accent` as the theme colour. */
export function createPainter(depth: ConsoleMode["depth"], accent: string): Painter {
  const colour = (text: string, hex: string) =>
    depth === 0 || text === "" ? text : `${colourEscape(hex, depth)}${text}\u001B[39m`;
  const sgr = (open: number, close: number) => (text: string) =>
    depth === 0 || text === "" ? text : `\u001B[${open}m${text}\u001B[${close}m`;
  return {
    colour,
    bold: sgr(1, 22),
    dim: sgr(2, 22),
    accent: (text) => colour(text, accent),
    success: (text) => colour(text, STATUS_COLOURS.success),
    warning: (text) => colour(text, STATUS_COLOURS.warning),
    error: (text) => colour(text, STATUS_COLOURS.error),
  };
}
