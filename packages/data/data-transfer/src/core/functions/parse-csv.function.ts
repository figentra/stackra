/**
 * Stackra file contract:
 * Purpose: `parseCsv`, the records of CSV text streamed in chunks (RFC 4180): quoted cells with doubled quotes and line
 *          breaks, CRLF, LF or CR line ends, and a chunk boundary anywhere.
 * Boundary: internal to the CSV reader. Lenient where spreadsheet tools are: text after a closing quote joins the
 *           cell, and a quote inside an unquoted cell is kept. Blank lines are skipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 2).
 */

/**
 * The records of `text`, each an array of cells.
 *
 * @yields One record at a time, as its cells.
 *
 * @example
 * for await (const cells of parseCsv(decodeText(file, undefined, fallback), ",")) { ... }
 */
export async function* parseCsv(
  text: AsyncIterable<string>,
  delimiter: string,
): AsyncGenerator<string[]> {
  let record: string[] = [];
  let field = "";
  let isQuoted = false;
  let isAfterQuote = false;
  let isFieldStart = true;
  let isDirty = false;
  let isAfterCr = false;
  for await (const chunk of text) {
    for (const character of chunk) {
      if (isAfterCr) {
        isAfterCr = false;
        if (character === "\n") continue;
      }
      if (isQuoted) {
        if (character === '"') {
          isQuoted = false;
          isAfterQuote = true;
        } else field += character;
        continue;
      }
      if (character === '"' && (isFieldStart || isAfterQuote)) {
        if (isAfterQuote) field += '"';
        isQuoted = true;
        isAfterQuote = false;
        isFieldStart = false;
        isDirty = true;
        continue;
      }
      if (character === delimiter) {
        record.push(field);
        field = "";
        isFieldStart = true;
        isAfterQuote = false;
        isDirty = true;
        continue;
      }
      if (character === "\r" || character === "\n") {
        isAfterCr = character === "\r";
        if (isDirty) {
          record.push(field);
          yield record;
        }
        record = [];
        field = "";
        isFieldStart = true;
        isAfterQuote = false;
        isDirty = false;
        continue;
      }
      field += character;
      isFieldStart = false;
      isAfterQuote = false;
      isDirty = true;
    }
  }
  if (isDirty) {
    record.push(field);
    yield record;
  }
}
