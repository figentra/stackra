/**
 * Stackra file contract:
 * Purpose: `code128(data, { gs1 })`, a Code 128 encoder: code set C for runs of four or more digits, code set B for the
 *          rest, the modulo 103 check value and the stop; with `gs1`, the symbol starts with FNC1 (GS1-128) and each
 *          group separator character (`\u001d`) between variable-length element strings becomes FNC1.
 * Boundary: pure. Printable ASCII (32 to 126) only: control characters other than the GS1 separator need code set A,
 *           which no consumer needs today, so they are a `RangeError`. Returns symbol values and module widths; drawing
 *           (SVG, ZPL, PDF) is the caller's.
 * Runtime: isomorphic
 * Governing contract: ISO/IEC 15417; GS1 General Specifications (GS1-128); ADR 0305; COM-323.
 */
import { CODE128_PATTERNS } from "#core/constants/code128-patterns.constant";
import type { Code128Symbol } from "#core/types/code128-symbol.type";

/** Symbol values with a fixed meaning. */
const FNC1 = 102;
const START_B = 104;
const START_C = 105;
const CODE_B = 100;
const CODE_C = 99;
const STOP = 106;

/** The GS1 group separator a caller writes between variable-length element strings. */
const GS = "\u001d";

/** How many digits run from `index`. */
function digitRun(data: string, index: number): number {
  let end = index;
  while (end < data.length && (data[end] ?? "") >= "0" && (data[end] ?? "") <= "9") end += 1;
  return end - index;
}

/**
 * The Code 128 symbol of `data`.
 *
 * @param options.gs1 - encode as GS1-128: lead with FNC1 and turn each `\u001d` into FNC1.
 * @throws RangeError when `data` is empty or holds a character outside printable ASCII (and `\u001d` with `gs1`).
 * @example
 * code128("ABC-12").values[0]; // 104 (Start B)
 * code128("0109501101530003", { gs1: true }).values.slice(0, 2); // [105, 102]
 */
export function code128(data: string, options: { readonly gs1?: boolean } = {}): Code128Symbol {
  if (data === "") throw new RangeError("code128: nothing to encode");
  const gs1 = options.gs1 === true;
  const values: number[] = [];
  let set: "B" | "C" | undefined;
  /** Switches to `next`, as the start value when nothing is encoded yet. */
  const use = (next: "B" | "C"): void => {
    if (set === next) return;
    values.push(
      set === undefined ? (next === "C" ? START_C : START_B) : next === "C" ? CODE_C : CODE_B,
    );
    set = next;
  };
  let index = 0;
  const leading = digitRun(data, 0);
  use(leading >= 4 || (leading === 2 && leading === data.length) ? "C" : "B");
  if (gs1) values.push(FNC1);
  while (index < data.length) {
    const char = data[index] ?? "";
    if (char === GS && gs1) {
      values.push(FNC1);
      index += 1;
      continue;
    }
    const run = digitRun(data, index);
    if (run >= 4 || (set === "C" && run >= 2)) {
      use("C");
      const pairs = Math.floor(run / 2) * 2;
      for (let at = index; at < index + pairs; at += 2) values.push(Number(data.slice(at, at + 2)));
      index += pairs;
      continue;
    }
    const code = char.charCodeAt(0);
    if (code < 32 || code > 126)
      throw new RangeError(`code128: character ${code} is outside printable ASCII`);
    use("B");
    values.push(code - 32);
    index += 1;
  }
  const check = values.reduce((sum, value, at) => sum + value * Math.max(at, 1), 0) % 103;
  values.push(check, STOP);
  return Object.freeze({
    values: Object.freeze(values),
    widths: values.map((value) => CODE128_PATTERNS[value]).join(""),
  });
}
