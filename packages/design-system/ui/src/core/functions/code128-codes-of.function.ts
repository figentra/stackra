/**
 * Stackra file contract:
 * Purpose: `code128CodesOf(value)`, the Code 128 symbol values of a text: the start symbol, the data in subset B
 *          (printable ASCII) with subset C (digit pairs) for runs of digits long enough to save space, the mod-103
 *          check symbol and the stop symbol. `null` when the text is empty or has a character outside ASCII 32–126.
 * Boundary: pure; the bars come from `code128ModulesOf`. Subset A (control characters) is not used.
 * Runtime: isomorphic
 * Governing contract: ISO/IEC 15417 (Code 128); STA-1371 (wave D, owner approval 2026-10-30).
 */

const START_B = 104;
const START_C = 105;
const CODE_B = 100;
const CODE_C = 99;
const STOP = 106;

/** How many digits run from `from`. */
const digitRunAt = (value: string, from: number): number => {
  let end = from;
  while (end < value.length && /\d/.test(value[end] ?? "")) end += 1;
  return end - from;
};

/** The symbol values, start to stop, or null for a text Code 128 B/C cannot hold. */
export function code128CodesOf(value: string): number[] | null {
  if (value.length === 0) return null;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.codePointAt(i) ?? 0;
    if (code < 32 || code > 126) return null;
  }
  const data: number[] = [];
  let subset: "B" | "C" | null = null;
  let i = 0;
  while (i < value.length) {
    let run = digitRunAt(value, i);
    // C pays off for 4+ digits at either end of the text, or 6+ in the middle (the usual rule).
    const isEdge = i === 0 || i + run === value.length;
    if (run >= (isEdge ? 4 : 6)) {
      if (run % 2 === 1) {
        // An odd run: its first digit goes in B, the rest in pairs.
        if (subset !== "B") {
          data.push(subset === null ? START_B : CODE_B);
          subset = "B";
        }
        data.push((value.codePointAt(i) ?? 0) - 32);
        i += 1;
        run -= 1;
      }
      if (subset !== "C") {
        data.push(subset === null ? START_C : CODE_C);
        subset = "C";
      }
      for (const end = i + run; i < end; i += 2) data.push(Number(value.slice(i, i + 2)));
    } else {
      if (subset !== "B") {
        data.push(subset === null ? START_B : CODE_B);
        subset = "B";
      }
      data.push((value.codePointAt(i) ?? 0) - 32);
      i += 1;
    }
  }
  const check = data.reduce((sum, code, position) => sum + code * Math.max(1, position), 0) % 103;
  return [...data, check, STOP];
}
