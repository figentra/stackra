/**
 * Stackra file contract:
 * Purpose: `qrPathOf(value, level)`, a QR code for a text as one SVG path of its dark modules (one unit per module,
 *          a four-module quiet zone around it) and the side length, encoded by `uqr` (MIT, from the catalogue).
 * Boundary: pure; the path draws the same on web (SVG) and native (react-native-svg).
 * Runtime: isomorphic
 * Governing contract: ISO/IEC 18004; STA-1371 (wave A: QR from a catalogue dependency).
 */
import { encode } from "uqr";

/** The QR path and its side length in modules. */
export function qrPathOf(
  value: string,
  level: "L" | "M" | "Q" | "H" = "M",
): { readonly path: string; readonly size: number } {
  const { data, size } = encode(value, { ecc: level, border: 4 });
  let path = "";
  data.forEach((row, y) =>
    row.forEach((isDark, x) => {
      if (isDark) path += `M${x} ${y}h1v1h-1z`;
    }),
  );
  return { path, size };
}
