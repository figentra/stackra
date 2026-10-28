/**
 * Stackra file contract:
 * Purpose: `toVisualOrder`, one line of mixed-direction text reordered left to right as a device that cannot run the
 *          bidi algorithm must draw it, with brackets mirrored inside right-to-left runs.
 * Boundary: for line printers and displays only, after `shapeArabic`; HTML, PDF and DOCX keep logical order and let
 *           their engine reorder. It applies the implicit rules of UAX #9 to one line with no explicit embeddings:
 *           strong types, European numbers taking the preceding strong type (W7), neutrals between equal strong types
 *           taking it and others the base direction (N1, N2), levels (I1, I2), then reversal (L2) and mirroring (L4).
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */

/** A resolved bidi class: strong left, strong right, a number, or neutral. */
type BidiClass = "L" | "R" | "EN" | "N";

/** Brackets and their mirrors. */
const MIRRORS = new Map<string, string>([
  ["(", ")"],
  [")", "("],
  ["[", "]"],
  ["]", "["],
  ["{", "}"],
  ["}", "{"],
  ["<", ">"],
  [">", "<"],
  ["«", "»"],
  ["»", "«"],
]);

/** The bidi class of one character. */
function classOf(character: string): BidiClass {
  const point = character.codePointAt(0) ?? 0;
  if (/\p{Nd}/u.test(character)) return "EN";
  if (
    (point >= 0x05_90 && point <= 0x08_ff) ||
    (point >= 0xfb_1d && point <= 0xfd_ff) ||
    (point >= 0xfe_70 && point <= 0xfe_ff)
  )
    return "R";
  return /\p{L}/u.test(character) ? "L" : "N";
}

/**
 * `line` in visual order, left to right, for a paragraph of `direction`.
 *
 * @example
 * toVisualOrder("رقم 12", "rtl"); // "12 مقر"
 */
export function toVisualOrder(line: string, direction: "ltr" | "rtl"): string {
  const characters = [...line];
  const base: BidiClass = direction === "rtl" ? "R" : "L";
  const classes = characters.map(classOf);
  // W7: a number after strong left (or at the start of a left-to-right line) is left.
  let strong = base;
  for (let index = 0; index < classes.length; index += 1) {
    const current = classes[index];
    if (current === "L" || current === "R") strong = current;
    else if (current === "EN" && strong === "L") classes[index] = "L";
  }
  // N1, N2: a run of neutrals takes the type around it when both sides agree (numbers count as right), else the base.
  const sideOf = (bidi: BidiClass | undefined): BidiClass => (bidi === "EN" ? "R" : (bidi ?? base));
  for (let start = 0; start < classes.length; start += 1) {
    if (classes[start] !== "N") continue;
    let end = start;
    while (end < classes.length && classes[end] === "N") end += 1;
    const before = sideOf(start === 0 ? base : classes[start - 1]);
    const after = sideOf(end === classes.length ? base : classes[end]);
    const resolved = before === after ? before : base;
    for (let index = start; index < end; index += 1) classes[index] = resolved;
    start = end - 1;
  }
  // I1, I2: the embedding level of each character.
  const baseLevel = direction === "rtl" ? 1 : 0;
  const levels = classes.map((bidi) => {
    if (baseLevel === 0) return bidi === "L" ? 0 : bidi === "R" ? 1 : 2;
    return bidi === "R" ? 1 : 2;
  });
  const order = characters.map((_, index) => index);
  const highest = Math.max(baseLevel, ...levels);
  // L2: from the highest level down to the lowest odd level, reverse every run at that level or above.
  for (let level = highest; level >= 1; level -= 1) {
    for (let start = 0; start < order.length; start += 1) {
      if ((levels[order[start] ?? 0] ?? 0) < level) continue;
      let end = start;
      while (end < order.length && (levels[order[end] ?? 0] ?? 0) >= level) end += 1;
      // oxlint-disable-next-line unicorn/no-array-reverse -- reverses an array built here, which nothing else holds; toReversed is ES2023 and the base lib is ES2022
      order.splice(start, end - start, ...order.slice(start, end).reverse());
      start = end - 1;
    }
  }
  return order
    .map((index) => {
      const character = characters[index] ?? "";
      return (levels[index] ?? 0) % 2 === 1 ? (MIRRORS.get(character) ?? character) : character;
    })
    .join("");
}
