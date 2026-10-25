/**
 * Stackra file contract:
 * Purpose: `shapeArabic`, Arabic text with each letter replaced by its contextual presentation form (isolated,
 *          final, initial, medial) and lam-alef joined into its ligature, for a device that draws characters one by
 *          one and cannot shape (a thermal receipt printer in text mode, a ZPL label printer, a pole display).
 * Boundary: keeps logical order; pair it with `toVisualOrder` for a device that also cannot reorder. HTML, PDF and
 *           DOCX never use it: their engines shape. The form table is Unicode's (Arabic Presentation Forms-B), not
 *           business data. Harakat are transparent to joining. Letters outside the basic Arabic block pass through
 *           unshaped.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */

/** Dual-joining, right-joining or non-joining. */
type Joining = "D" | "R" | "U";

/** Each letter's isolated presentation form and joining type; final is +1, initial +2, medial +3. */
const FORMS = new Map<number, readonly [number, Joining]>([
  [0x0621, [0xfe80, "U"]],
  [0x0622, [0xfe81, "R"]],
  [0x0623, [0xfe83, "R"]],
  [0x0624, [0xfe85, "R"]],
  [0x0625, [0xfe87, "R"]],
  [0x0626, [0xfe89, "D"]],
  [0x0627, [0xfe8d, "R"]],
  [0x0628, [0xfe8f, "D"]],
  [0x0629, [0xfe93, "R"]],
  [0x062a, [0xfe95, "D"]],
  [0x062b, [0xfe99, "D"]],
  [0x062c, [0xfe9d, "D"]],
  [0x062d, [0xfea1, "D"]],
  [0x062e, [0xfea5, "D"]],
  [0x062f, [0xfea9, "R"]],
  [0x0630, [0xfeab, "R"]],
  [0x0631, [0xfead, "R"]],
  [0x0632, [0xfeaf, "R"]],
  [0x0633, [0xfeb1, "D"]],
  [0x0634, [0xfeb5, "D"]],
  [0x0635, [0xfeb9, "D"]],
  [0x0636, [0xfebd, "D"]],
  [0x0637, [0xfec1, "D"]],
  [0x0638, [0xfec5, "D"]],
  [0x0639, [0xfec9, "D"]],
  [0x063a, [0xfecd, "D"]],
  [0x0641, [0xfed1, "D"]],
  [0x0642, [0xfed5, "D"]],
  [0x0643, [0xfed9, "D"]],
  [0x0644, [0xfedd, "D"]],
  [0x0645, [0xfee1, "D"]],
  [0x0646, [0xfee5, "D"]],
  [0x0647, [0xfee9, "D"]],
  [0x0648, [0xfeed, "R"]],
  [0x0649, [0xfeef, "R"]],
  [0x064a, [0xfef1, "D"]],
]);

/** Lam followed by these alefs becomes one ligature (isolated form; final is +1). */
const LAM_ALEF = new Map<number, number>([
  [0x0622, 0xfef5],
  [0x0623, 0xfef7],
  [0x0625, 0xfef9],
  [0x0627, 0xfefb],
]);

const LAM = 0x0644;
const TATWEEL = 0x0640;

/** Harakat and the superscript alef: they sit on a letter and do not break joining. */
function isTransparent(codePoint: number): boolean {
  return (codePoint >= 0x064b && codePoint <= 0x065f) || codePoint === 0x0670;
}

/** Whether the letter connects to the letter after it. */
function joinsForward(codePoint: number | undefined): boolean {
  return codePoint === TATWEEL || (codePoint !== undefined && FORMS.get(codePoint)?.[1] === "D");
}

/** Whether the letter connects to the letter before it. */
function joinsBackward(codePoint: number | undefined): boolean {
  if (codePoint === TATWEEL) return true;
  const joining = codePoint === undefined ? undefined : FORMS.get(codePoint)?.[1];
  return joining === "D" || joining === "R";
}

/**
 * `text` with its Arabic letters in their contextual forms.
 *
 * @example
 * shapeArabic("سلام"); // "ﺳﻼﻡ"
 */
export function shapeArabic(text: string): string {
  const points = Array.from(text, (character) => character.codePointAt(0) ?? 0);
  const neighbour = (from: number, step: 1 | -1): number => {
    let index = from + step;
    while (index >= 0 && index < points.length && isTransparent(points[index] ?? 0)) index += step;
    return index;
  };
  let shaped = "";
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index] ?? 0;
    const entry = FORMS.get(point);
    if (entry === undefined) {
      shaped += String.fromCodePoint(point);
      continue;
    }
    const previous = points[neighbour(index, -1)];
    const isJoinedBefore = joinsForward(previous) && joinsBackward(point);
    const nextIndex = neighbour(index, 1);
    const next = points[nextIndex];
    const ligature = point === LAM && next !== undefined ? LAM_ALEF.get(next) : undefined;
    if (ligature !== undefined) {
      shaped += String.fromCodePoint(isJoinedBefore ? ligature + 1 : ligature);
      for (let mark = index + 1; mark < nextIndex; mark += 1)
        shaped += String.fromCodePoint(points[mark] ?? 0);
      index = nextIndex;
      continue;
    }
    const isJoinedAfter = entry[1] === "D" && joinsBackward(next);
    const [isolated] = entry;
    if (isJoinedBefore && isJoinedAfter) shaped += String.fromCodePoint(isolated + 3);
    else if (isJoinedBefore) shaped += String.fromCodePoint(isolated + 1);
    else if (isJoinedAfter) shaped += String.fromCodePoint(isolated + 2);
    else shaped += String.fromCodePoint(isolated);
  }
  return shaped;
}
