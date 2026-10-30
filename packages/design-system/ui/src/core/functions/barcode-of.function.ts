/**
 * Stackra file contract:
 * Purpose: `barcodeOf(value, format)`, what `Barcode` draws: the modules ("1" a bar), the SVG path of the bars (one
 *          unit per module, `height` units tall, a ten-module quiet zone on each side), the full width in modules and
 *          the human-readable text (the EAN-13 number with its check digit). `null` when the value is invalid.
 * Boundary: pure; the same path draws on web (SVG) and native (react-native-svg).
 * Runtime: isomorphic
 * Governing contract: ISO/IEC 15417; ISO/IEC 15420; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { BarcodeFormat } from "#contracts/enums/barcode-format.enum";
import { code128ModulesOf } from "#core/functions/code128-modules-of.function";
import { ean13ModulesOf } from "#core/functions/ean13-modules-of.function";

/** The quiet zone on each side, in modules (Code 128 asks for ten; EAN-13 eleven and seven, ten is enough on screen). */
const QUIET = 10;

/** The barcode drawing, or null. */
export function barcodeOf(
  value: string,
  format: BarcodeFormat,
  height: number,
): { readonly path: string; readonly width: number; readonly text: string } | null {
  const ean = format === "ean13" ? ean13ModulesOf(value) : null;
  const modules = format === "ean13" ? (ean?.modules ?? null) : code128ModulesOf(value);
  if (modules === null) return null;
  let path = "";
  let x = 0;
  while (x < modules.length) {
    if (modules[x] === "1") {
      let end = x;
      while (modules[end] === "1") end += 1;
      path += `M${x + QUIET} 0h${end - x}v${height}h-${end - x}z`;
      x = end;
    } else x += 1;
  }
  return { path, width: modules.length + QUIET * 2, text: ean?.digits ?? value };
}
