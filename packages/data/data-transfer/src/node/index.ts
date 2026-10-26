/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/data-transfer, the XLSX reader and writer, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The only entry that loads exceljs, so `.` and `./contracts` stay
 *           browser-safe (ADR 0431 decision 5). `EXCELJS` and `cellText` stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0431 (decision 5); the STA-347 stand-in barrel decision.
 */
export { XlsxReaderDriver } from "#node/drivers/xlsx-reader.driver";
export { XlsxWriterDriver } from "#node/drivers/xlsx-writer.driver";
