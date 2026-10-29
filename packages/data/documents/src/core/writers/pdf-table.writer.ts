/**
 * Stackra file contract:
 * Purpose: `PdfTableWriter`, data-transfer's `TabularWriter` for PDF: one sheet printed as a PDF table (the header row
 *          as table headings) through a `PdfEngine`, so a queued list or report export writes PDF through the same port
 *          as CSV, XLSX and JSON Lines.
 * Boundary: implements the port only. A plain class, not a driver: the caller builds one per export with its page and
 *           row cap, which are values and not class tokens (gen's `token_not_a_class`). A PDF is printed whole, so the
 *           rows are collected (at most `maxRows`, the caller's configured cap) and the file is yielded as one chunk
 *           once the engine has printed it. Every cell is escaped and isolated (`dir="auto"`), so Arabic and Latin
 *           values keep their own direction; a date prints as ISO 8601 and an empty cell as nothing. The page size and
 *           margins are the caller's (`PdfPage`), never fixed here.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 4: exports); ADR 0307 (rule 10); ADR 0470 (decision 7); ADR 0367 (tabular
 *                     ports); reporting gap 11.
 */
import { TransferLimitExceededError } from "@stackra/data-transfer";
import type { TabularCell, TabularSheet, TabularWriter } from "@stackra/data-transfer/contracts";
import { escapeHtml } from "@stackra/support";

import type { PdfEngine } from "#contracts/ports/pdf-engine.port";
import type { PdfPage } from "#contracts/types/pdf-page.type";

/** One cell as escaped text. */
const text = (cell: TabularCell | undefined): string =>
  escapeHtml(cell instanceof Date ? cell.toISOString() : String(cell ?? ""));

/**
 * Prints one sheet as a PDF table.
 *
 * @example
 * const writer = new PdfTableWriter(pdfEngine, { widthMm: 297, heightMm: 210, marginMm: 10 }, 5000);
 * await files.writeStream(path, writer.write([{ name: "Orders", rows }]), { contentType: writer.mediaType });
 */
export class PdfTableWriter implements TabularWriter {
  /** The port brand of `TabularWriter`, type-only: this writer stands in for the port. */
  declare readonly "~kind": "port";

  /** The port key of `TabularWriter`, type-only. */
  declare readonly "~key": "data-transfer.TabularWriter";

  /** The media type of the written file, `application/pdf`. */
  readonly mediaType = "application/pdf";

  /** Prints the HTML. */
  private readonly engine: PdfEngine;

  /** The page the table is printed on. */
  private readonly page: PdfPage;

  /** The most data rows one file holds. */
  private readonly maxRows: number;

  /**
   * @param engine - the PDF engine (Gotenberg in production).
   * @param page - the page size and margins.
   * @param maxRows - the most data rows one PDF holds, from the caller's configuration.
   */
  constructor(engine: PdfEngine, page: PdfPage, maxRows: number) {
    this.engine = engine;
    this.page = page;
    this.maxRows = maxRows;
  }

  /**
   * Implements `TabularWriter.write`, documented there.
   *
   * @yields The PDF, as one chunk.
   * @throws TypeError when there is not exactly one sheet.
   * @throws TransferLimitExceededError when the sheet has more than `maxRows` data rows.
   */
  async *write(sheets: readonly TabularSheet[]): AsyncGenerator<Uint8Array> {
    const [sheet] = sheets;
    if (sheet === undefined || sheets.length !== 1)
      throw new TypeError(
        `A PDF table holds one sheet, not ${sheets.length}: write each sheet to its own file`,
      );
    const head: string[] = [];
    const body: string[] = [];
    for await (const row of sheet.rows) {
      if (head.length === 0) {
        head.push(row.map((cell) => `<th dir="auto">${text(cell)}</th>`).join(""));
        continue;
      }
      if (body.length >= this.maxRows)
        throw TransferLimitExceededError.create({ limit: "rows", max: this.maxRows });
      body.push(`<tr>${row.map((cell) => `<td dir="auto">${text(cell)}</td>`).join("")}</tr>`);
    }
    const html =
      '<!doctype html><html><head><meta charset="utf-8"><style>' +
      "body{font-family:sans-serif;font-size:8pt}table{width:100%;border-collapse:collapse}" +
      "th,td{border-bottom:.2mm solid #000;padding:1mm;text-align:start}thead{display:table-header-group}" +
      `</style></head><body><h1 dir="auto">${escapeHtml(sheet.name)}</h1>` +
      `<table><thead><tr>${head.join("")}</tr></thead><tbody>${body.join("")}</tbody></table></body></html>`;
    yield await this.engine.print(html, this.page);
  }
}
