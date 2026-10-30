/**
 * Stackra file contract:
 * Purpose: `isolateText(text, dir)`, a string wrapped in Unicode's directional isolate marks, so a SKU, a phone
 *          number or an e-mail inside Arabic text keeps its own order, in places only a string fits: an
 *          `aria-label`, a placeholder, a toast, a React Native `Text`.
 * Boundary: pure; adds two invisible characters, never changes the text itself.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0060.
 */
import type { Direction } from "#contracts/enums/direction.enum";

/** The opening isolate of each direction: first strong isolate, left-to-right isolate, right-to-left isolate. */
const OPEN = Object.freeze({ auto: "⁨", ltr: "⁦", rtl: "⁧" });

/** Pop directional isolate: closes the run. */
const CLOSE = "⁩";

/**
 * The text isolated from the text around it.
 * @param text - the run to isolate
 * @param dir - its direction; `auto` (the default) takes it from its first strong letter
 * @returns the text between an isolate mark and the closing mark
 */
export function isolateText(text: string, dir: Direction | "auto" = "auto"): string {
  return `${OPEN[dir]}${text}${CLOSE}`;
}
