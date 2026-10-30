/**
 * Stackra file contract:
 * Purpose: `fileNamePartsOf`, which cuts a file name into its base and its extension and says which way the base
 *          reads, so a renderer can isolate each part and keep the extension at the name's reading end instead of
 *          letting bidi move it ("فاتورة-1042.pdf" must not read "pdf.1042-فاتورة").
 * Boundary: pure; never reverses or rewrites a character. An extension is the last dot followed by one to eight
 *           letters or digits, at least one a letter, after a non-empty base, so "1.5 GB" and ".env" have none.
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (right-to-left); UAX #9 (isolates); STA-1371 (wave C).
 */
import type { FileNameParts } from "#core/types/file-name-parts.type";

/** A trailing extension: a dot, then letters and digits with at least one letter. */
const EXTENSION = /(?<=.)\.(?=[\p{L}\p{N}]{0,7}\p{L})[\p{L}\p{N}]{1,8}$/u;

/** The first letter of a text. */
const FIRST_LETTER = /\p{L}/u;

/** Letters of right-to-left scripts: Hebrew, Arabic, Syriac, Thaana, N'Ko and the Arabic presentation forms. */
const RIGHT_TO_LEFT = /[\u{0590}-\u{08FF}\u{FB1D}-\u{FDFF}\u{FE70}-\u{FEFF}]/u;

/** The parts of `name`. */
export function fileNamePartsOf(name: string): FileNameParts {
  const match = EXTENSION.exec(name);
  const base = match ? name.slice(0, match.index) : name;
  const letter = FIRST_LETTER.exec(base)?.[0] ?? "";
  return {
    base,
    extension: match ? match[0] : "",
    direction: RIGHT_TO_LEFT.test(letter) ? "rtl" : "ltr",
  };
}
