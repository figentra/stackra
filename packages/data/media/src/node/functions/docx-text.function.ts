/**
 * Stackra file contract:
 * Purpose: `docxText`, the body text of a DOCX file in reading order: paragraphs on their own lines, tabs and breaks
 *          kept, XML entities decoded.
 * Boundary: pure and in process (fflate unzip, no network). Reads `word/document.xml` only: headers, footers,
 *           footnotes and comments are not read, and deleted text of tracked changes (`w:delText`) is left out. Word
 *           stores right-to-left text in logical order, so Arabic comes out as written.
 * Runtime: node
 * Governing contract: ADR 0234; R3-SO-13 (DOCX extraction in region); STA-789.
 */
import { strFromU8, unzipSync } from "fflate";

/** The part of a DOCX that holds the body. */
const BODY = "word/document.xml";

/** A run's text, a run tab, a line break and a paragraph end; a tab stop (`<w:tab w:val=…/>`) is not a run tab. */
const TOKEN = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:(?:br|cr)\b[^>]*\/>|<\/w:p>/g;

/** The five named XML entities. */
const ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** `text` with its XML character and entity references decoded. */
function decodeXml(text: string): string {
  return text.replaceAll(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (reference, name: string) => {
    if (name.startsWith("#x") || name.startsWith("#X"))
      return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
    if (name.startsWith("#")) return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
    return ENTITIES[name] ?? reference;
  });
}

/**
 * The body text of a DOCX.
 *
 * @example
 * docxText(bytes); // "العقد\nThe contract"
 * @throws RangeError when `bytes` is not a ZIP holding `word/document.xml`.
 */
export function docxText(bytes: Uint8Array): string {
  let xml: Uint8Array | undefined;
  try {
    xml = unzipSync(bytes, { filter: (file) => file.name === BODY })[BODY];
  } catch (error) {
    throw new RangeError("Not a DOCX file: it is not a readable ZIP archive", { cause: error });
  }
  if (xml === undefined) throw new RangeError(`Not a DOCX file: it has no ${BODY}`);
  let text = "";
  for (const match of strFromU8(xml).matchAll(TOKEN))
    text += match[1] ?? (match[0] === "<w:tab/>" ? "\t" : "\n");
  return decodeXml(text).trim();
}
