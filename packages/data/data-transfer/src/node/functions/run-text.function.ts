/**
 * Stackra file contract:
 * Purpose: `runText`, the text of a SpreadsheetML string item (`<si>`, `<is>`): every `<t>` run joined, phonetic
 *          runs left out.
 * Boundary: pure; internal to the XLSX reader.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2).
 */
import { xmlText } from "#node/functions/xml-text.function";

/**
 * The text of every `<t>` in `xml`, joined: a shared or inline string's runs, without its phonetic (`rPh`) runs.
 *
 * @example
 * runText("<r><t>مر</t></r><r><t>حبا</t></r>"); // "مرحبا"
 */
export function runText(xml: string): string {
  return [
    ...xml
      .replaceAll(/<(?:[\w-]+:)?rPh\b[\s\S]*?<\/(?:[\w-]+:)?rPh>/g, "")
      .matchAll(/<(?:[\w-]+:)?t\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:[\w-]+:)?t>)/g),
  ]
    .map((match) => xmlText(match[1] ?? ""))
    .join("");
}
