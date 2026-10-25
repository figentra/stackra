/**
 * Stackra file contract:
 * Purpose: `previewTabular`, the header and first data rows of each sheet of a file: what the mapping screen shows
 *          before an import commits.
 * Boundary: reads through a `TabularReader`; it stops reading once a CSV file or a single chosen sheet has its rows, and reads a
 *           workbook through (its sheets follow each other) keeping only the first rows of each. `rows` is the caller's
 *           preview-size setting.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 5).
 */
import type { TabularReader } from "#contracts/ports/tabular-reader.port";
import type { TabularSource } from "#contracts/types/tabular-source.type";
import type { PreviewOptions } from "#core/types/preview-options.type";
import type { TabularPreview } from "#core/types/tabular-preview.type";

/**
 * The preview of `source`.
 *
 * @example
 * const preview = await previewTabular(new CsvReaderDriver(), upload, { rows: settings.previewRows, fallbackEncoding });
 * @throws whatever the reader throws (limits, encoding).
 * @throws RangeError when `options.rows` is not a whole number of zero or more.
 */
export async function previewTabular(
  reader: TabularReader,
  source: TabularSource,
  options: PreviewOptions,
): Promise<TabularPreview> {
  const { rows: size, ...readOptions } = options;
  if (!Number.isInteger(size) || size < 0)
    throw new RangeError(`A preview keeps a whole number of rows, not ${String(size)}`);
  const sheets: { name: string; header: string[]; rows: string[][] }[] = [];
  for await (const row of reader.read(source, readOptions)) {
    let sheet = sheets.at(-1);
    if (sheet === undefined || sheet.name !== row.sheet) {
      sheet = { name: row.sheet, header: [...row.cells], rows: [] };
      sheets.push(sheet);
      continue;
    }
    if (sheet.rows.length < size) sheet.rows.push([...row.cells]);
    else if (row.sheet === "" || readOptions.sheets?.length === 1) break;
  }
  return { sheets };
}
