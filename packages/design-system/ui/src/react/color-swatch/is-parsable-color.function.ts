/**
 * Stackra file contract:
 * Purpose: `isParsableColor(text)`, whether React Aria's colour engine reads a colour string (hex, `rgb()`, `hsl()`,
 *          `hsb()`), so `ColorSwatch` and `ColorField` hand it only what it can parse instead of letting it throw.
 * Boundary: pure; anything else (a named colour, `oklch()`, a `var()`) is false.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1981.
 */
import { parseColor } from "react-aria-components";

/**
 * Whether a colour string parses.
 * @param text - the colour as the caller wrote it
 * @returns true when `parseColor` accepts it
 */
export function isParsableColor(text: string): boolean {
  try {
    parseColor(text);
    return true;
  } catch {
    return false;
  }
}
