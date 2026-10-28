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
  [0x06_21, [0xfe_80, "U"]],
  [0x06_22, [0xfe_81, "R"]],
  [0x06_23, [0xfe_83, "R"]],
  [0x06_24, [0xfe_85, "R"]],
  [0x06_25, [0xfe_87, "R"]],
  [0x06_26, [0xfe_89, "D"]],
  [0x06_27, [0xfe_8d, "R"]],
  [0x06_28, [0xfe_8f, "D"]],
  [0x06_29, [0xfe_93, "R"]],
  [0x06_2a, [0xfe_95, "D"]],
  [0x06_2b, [0xfe_99, "D"]],
  [0x06_2c, [0xfe_9d, "D"]],
  [0x06_2d, [0xfe_a1, "D"]],
  [0x06_2e, [0xfe_a5, "D"]],
  [0x06_2f, [0xfe_a9, "R"]],
  [0x06_30, [0xfe_ab, "R"]],
  [0x06_31, [0xfe_ad, "R"]],
  [0x06_32, [0xfe_af, "R"]],
  [0x06_33, [0xfe_b1, "D"]],
  [0x06_34, [0xfe_b5, "D"]],
  [0x06_35, [0xfe_b9, "D"]],
  [0x06_36, [0xfe_bd, "D"]],
  [0x06_37, [0xfe_c1, "D"]],
  [0x06_38, [0xfe_c5, "D"]],
  [0x06_39, [0xfe_c9, "D"]],
  [0x06_3a, [0xfe_cd, "D"]],
  [0x06_41, [0xfe_d1, "D"]],
  [0x06_42, [0xfe_d5, "D"]],
  [0x06_43, [0xfe_d9, "D"]],
  [0x06_44, [0xfe_dd, "D"]],
  [0x06_45, [0xfe_e1, "D"]],
  [0x06_46, [0xfe_e5, "D"]],
  [0x06_47, [0xfe_e9, "D"]],
  [0x06_48, [0xfe_ed, "R"]],
  [0x06_49, [0xfe_ef, "R"]],
  [0x06_4a, [0xfe_f1, "D"]],
]);

/** Lam followed by these alefs becomes one ligature (isolated form; final is +1). */
const LAM_ALEF = new Map<number, number>([
  [0x06_22, 0xfe_f5],
  [0x06_23, 0xfe_f7],
  [0x06_25, 0xfe_f9],
  [0x06_27, 0xfe_fb],
]);

const LAM = 0x06_44;
const TATWEEL = 0x06_40;

/** Harakat and the superscript alef: they sit on a letter and do not break joining. */
function isTransparent(codePoint: number): boolean {
  return (codePoint >= 0x06_4b && codePoint <= 0x06_5f) || codePoint === 0x06_70;
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
