/**
 * Stackra file contract:
 * Purpose: `ocrLines`, the text of an OCR result in logical reading order: it groups the recognised boxes into lines
 *          top to bottom and orders each line by its direction, right to left when most of the line's letters are in a
 *          right-to-left script (Arabic, Hebrew), left to right otherwise.
 * Boundary: pure. A box is `[xMin, yMin, xMax, yMax]` in pixels (PaddleOCR's `rec_boxes`); a box joins a line when its
 *           vertical centre falls inside the line's first box. Each box's own text is kept as the engine gave it.
 *           Without boxes the texts are joined in the engine's order, one per line.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (Arabic defaults); `ExtractedText` (logical order); STA-789.
 */
import type { OcrBox } from "#node/types/ocr-box.type";

/** A letter of a right-to-left script. */
const RTL = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}]/gu;

/** Whether most letters of `text` are right to left. */
function rightToLeft(text: string): boolean {
  const letters = text.match(/\p{L}/gu)?.length ?? 0;
  return (text.match(RTL)?.length ?? 0) * 2 > letters;
}

/**
 * The text of `texts` at `boxes`, one line per row, each row in its reading direction.
 *
 * @example
 * ocrLines(["العقد", "رقم"], [[200, 10, 260, 30], [120, 12, 180, 30]]); // "العقد رقم"
 */
export function ocrLines(texts: readonly string[], boxes?: readonly OcrBox[]): string {
  if (boxes === undefined || boxes.length !== texts.length) return texts.join("\n");
  const items = texts
    .map((text, index) => ({ text, box: boxes[index] as OcrBox }))
    .filter((item) => item.text.trim() !== "")
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort((a, b) => a.box[1] + a.box[3] - (b.box[1] + b.box[3]));
  const lines: (typeof items)[] = [];
  for (const item of items) {
    const centre = (item.box[1] + item.box[3]) / 2;
    const line = lines.find(
      ([first]) => first !== undefined && centre >= first.box[1] && centre <= first.box[3],
    );
    if (line === undefined) lines.push([item]);
    else line.push(item);
  }
  return lines
    .map((line) => {
      const rtl = rightToLeft(line.map((item) => item.text).join(""));
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      const ordered = [...line].sort((a, b) => (rtl ? b.box[0] - a.box[0] : a.box[0] - b.box[0]));
      return ordered.map((item) => item.text).join(" ");
    })
    .join("\n");
}
