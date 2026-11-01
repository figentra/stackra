/**
 * Stackra file contract:
 * Purpose: `renderBox(lines, options)`, a note box: rounded Unicode lines (ASCII without Unicode) around `lines`, a
 *          title set in the top edge, the edge coloured by `paint`, every line padded by display width.
 * Boundary: pure; returns the lines, ending without a newline.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-018, FR-021 and FR-026.
 */
import { SYMBOLS } from "#core/constants/symbols.constant";
import { displayWidth } from "#core/functions/display-width.function";
import { padTo } from "#core/functions/pad-to.function";

/** How a box is drawn. */
interface BoxOptions {
  /** The title set in the top edge. */
  readonly title?: string;
  /** Unicode lines, else ASCII. */
  readonly unicode: boolean;
  /** Colours the edge (and the title). */
  readonly paint: (text: string) => string;
  /** The widest the box may be, edges included. */
  readonly width: number;
}

/** Wraps `text` at spaces so no line is wider than `width` columns. */
function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const next = line === "" ? word : `${line} ${word}`;
      if (displayWidth(next) > width && line !== "") {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

/** The lines of a box around `text`. */
export function renderBox(text: string, options: BoxOptions): string[] {
  const [topLeft, topRight, bottomLeft, bottomRight, horizontal, vertical] =
    SYMBOLS[options.unicode ? "unicode" : "ascii"].box;
  const content = wrap(text, options.width - 6);
  const title = options.title === undefined ? "" : ` ${options.title} `;
  const inner = Math.max(...content.map(displayWidth), displayWidth(title) + 2) + 2;
  const top = `${topLeft}${horizontal}${title}${horizontal.repeat(Math.max(0, inner - displayWidth(title) - 1))}${topRight}`;
  return [
    options.paint(top),
    ...content.map(
      (line) => `${options.paint(vertical)} ${padTo(line, inner - 2)} ${options.paint(vertical)}`,
    ),
    options.paint(`${bottomLeft}${horizontal.repeat(inner)}${bottomRight}`),
  ];
}
