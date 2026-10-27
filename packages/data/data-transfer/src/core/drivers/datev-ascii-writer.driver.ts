/**
 * Stackra file contract:
 * Purpose: `DatevAsciiWriterDriver`, the `datev-ascii` driver of `TabularWriter`: the DATEV Lohn ASCII movement-data
 *          file (LODAS import) a German payroll office or Kombo's DATEV push takes, with its `[Allgemein]`,
 *          `[Satzbeschreibung]` and `[Bewegungsdaten]` sections.
 * Boundary: no dependency. One sheet whose header row names the DATEV fields (`pnr#bwd`); the section entries, record
 *           table and record number come from the profile (seed data) through `DatevWriteOptions`, never from code.
 *           ISO 8859-1 bytes with CRLF line ends and `;` fields; a character outside Latin-1, a `;` or a line break in
 *           a cell is refused rather than written as a corrupt line.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 4); ADR 0367 (decision 2); owner R3-SO-05.
 */
import { Driver } from "@stackra/container";

import { TabularWriter } from "#contracts/ports/tabular-writer.port";
import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import type { DatevWriteOptions } from "#core/types/datev-write-options.type";

/** `text` as ISO 8859-1 bytes. */
function latin1(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code > 0xff)
      throw new TypeError(
        `DATEV ASCII files are ISO 8859-1, which cannot hold "${text.charAt(index)}"`,
      );
    bytes[index] = code;
  }
  return bytes;
}

/** One cell as a DATEV field. */
function fieldOf(value: TabularCell): string {
  if (value === null) return "";
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  if (/[;\r\n]/.test(text))
    throw new TypeError("A DATEV ASCII field cannot hold a semicolon or a line break");
  return text;
}

/**
 * Writes DATEV ASCII movement-data files.
 *
 * @example
 * const bytes = new DatevAsciiWriterDriver().write([payrollSheet(profile, inputs)], datevWriteOptionsOf(profile, tenant));
 */
export class DatevAsciiWriterDriver extends Driver(TabularWriter) {
  /** The media type of the written file, `text/plain`. */
  readonly mediaType = "text/plain";

  /**
   * Implements `TabularWriter.write`, documented there.
   *
   * @yields The sections, then one line per data row.
   * @throws TypeError when the options are not `DatevWriteOptions`, there is not exactly one sheet, or a cell cannot
   *         be written.
   */
  async *write(
    sheets: readonly TabularSheet[],
    options?: DatevWriteOptions,
  ): AsyncGenerator<Uint8Array> {
    const [sheet] = sheets;
    if (sheet === undefined || sheets.length !== 1)
      throw new TypeError(`A DATEV ASCII file holds one sheet, not ${sheets.length}`);
    if (options?.general === undefined)
      throw new TypeError(
        "A DATEV ASCII write needs the profile's DATEV options: pass datevWriteOptionsOf(profile, tenant)",
      );
    const { general, recordTable, recordNumber } = options;
    let isHeader = true;
    for await (const row of sheet.rows) {
      const fields = row.map(fieldOf);
      if (isHeader) {
        isHeader = false;
        const entries = Object.entries(general).map(([key, value]) => `${key}=${value}\r\n`);
        yield latin1(
          `[Allgemein]\r\n${entries.join("")}\r\n[Satzbeschreibung]\r\n${recordNumber};${recordTable};${fields.join(";")};\r\n\r\n[Bewegungsdaten]\r\n`,
        );
        continue;
      }
      yield latin1(`${recordNumber};${fields.join(";")};\r\n`);
    }
  }
}
