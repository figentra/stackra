/**
 * Stackra file contract:
 * Purpose: `padTo(text, width, align?)`, `text` padded with spaces to `width` display columns (never by `.length`),
 *          at the end, the start or both sides.
 * Boundary: pure; text wider than `width` is returned as it is.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-026 and SC-004.
 */
import { displayWidth } from "#core/functions/display-width.function";

/** `text` padded to `width` columns. */
export function padTo(
  text: string,
  width: number,
  align: "start" | "end" | "center" = "start",
): string {
  const gap = Math.max(0, width - displayWidth(text));
  if (align === "end") return " ".repeat(gap) + text;
  if (align === "center")
    return " ".repeat(Math.floor(gap / 2)) + text + " ".repeat(Math.ceil(gap / 2));
  return text + " ".repeat(gap);
}
