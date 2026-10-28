/**
 * Stackra file contract:
 * Purpose: `parseContinuousAsciiLine`, one line of the A&D standard format stream read as a `ScaleLine`: the header
 *          `ST` (settled), `US` (moving) or `OL` (over capacity), an optional `GS`/`NT` (gross or net) or `TR`
 *          (tare) field, then the signed value and its unit, as `ST,+00123.45  g` or `US,NT,-0001.250kg`.
 * Boundary: pure. `OL` is a fault whatever value follows; a `QT` (counting) header, a unit with no gram value or a
 *           line of another shape is null. The grammar is transcribed from A&D's public interface manuals;
 *           certification replaces the tests' transcribed lines with recordings (STA-739).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5: mapping stays in the TypeScript driver).
 */
import { toGrams } from "#core/functions/to-grams.function";
import type { ScaleLine } from "#core/types/scale-line.type";

/** `<header>,[<field>,]<sign><digits> <unit>`. */
const LINE = /^(ST|US),(?:(GS|NT|TR|G|N|T),)?\s*([+-]?)\s*(\d+(?:\.\d+)?)\s*([A-Za-z]+)\s*$/;

/**
 * The parsed line, or null.
 *
 * @example
 * parseContinuousAsciiLine("ST,NT,+0001.250kg"); // { kind: "weight", value: 1.25, unit: "kg", grams: 1250, isStable: true, isNet: true }
 * parseContinuousAsciiLine("OL,+9999999 g"); // { kind: "fault", fault: "overload" }
 */
export function parseContinuousAsciiLine(line: string): ScaleLine | null {
  const text = line.trim();
  if (text.startsWith("OL,")) return { kind: "fault", fault: "overload" };
  const match = LINE.exec(text);
  if (match === null) return null;
  const [, header, field, sign, digits, unit] = match as unknown as [
    string,
    string,
    string | undefined,
    string,
    string,
    string,
  ];
  const value = Number(`${sign}${digits}`);
  const grams = toGrams(value, unit);
  if (grams === null) return null;
  if (field === "TR" || field === "T") return { kind: "tare", grams };
  const isNet = field === undefined ? null : field === "NT" || field === "N";
  return { kind: "weight", value, unit, grams, isStable: header === "ST", isNet };
}
