/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the drivers, refusals, functions (`writeZip` among them) and `ImportRunner` are exported
 *          and nothing else is (no port, no XLSX driver, no internal parser or constant), the public types resolve, and a CSV upload
 *          runs end to end through preview, column matching and import.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0367.
 */
import { Clock } from "@stackra/contracts";
import { Driver } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import * as dataTransfer from "#core/index";
import {
  CsvReaderDriver,
  ImportRunner,
  MemoryImportLedgerDriver,
  matchColumns,
  previewTabular,
} from "#core/index";
import type {
  ColumnField,
  ColumnMapping,
  ImportOptions,
  ImportReport,
  PayInput,
  PreviewOptions,
  RevertOptions,
  RevertTargets,
  SheetImport,
  TabularPreview,
  WarehouseSyncOptions,
  WarehouseSyncReport,
  WorkbookImportOptions,
  ZipEntry,
} from "#core/index";

class SystemClock extends Driver(Clock) {
  now(): Date {
    return new Date();
  }
}

describe("@stackra/data-transfer", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(dataTransfer).sort()).toEqual([
      "CsvReaderDriver",
      "CsvWriterDriver",
      "DatevAsciiWriterDriver",
      "IMPORT_MAPPING_PROFILE_SCHEMA",
      "ImportRunClosedError",
      "ImportRunNotFoundError",
      "ImportRunner",
      "ImportUndoExpiredError",
      "JsonLinesReaderDriver",
      "JsonLinesWriterDriver",
      "MemoryImportLedgerDriver",
      "MemoryTabularReaderDriver",
      "MemoryTabularWriterDriver",
      "PAYROLL_EXPORT_PROFILE_SCHEMA",
      "ParquetWarehouseSinkDriver",
      "ParquetWriterDriver",
      "TransferLimitExceededError",
      "UnreadableEncodingError",
      "WarehouseChangeSink",
      "compileMapping",
      "datevWriteOptionsOf",
      "detectEncoding",
      "matchColumns",
      "normalizeHeader",
      "payrollSheet",
      "previewTabular",
      "sheetImportsOf",
      "warehouseBatches",
      "warehousePath",
      "warehouseSheet",
      "writeZip",
    ]);
    expect("XlsxReaderDriver" in dataTransfer).toBe(false);
    expect("TabularReader" in dataTransfer).toBe(false);
    expect("parseCsv" in dataTransfer).toBe(false);
    expect("crc32" in dataTransfer).toBe(false);
    expect("encodeThrift" in dataTransfer).toBe(false);
  });

  it("resolves its public types", () => {
    expectTypeOf<ColumnMapping>().toEqualTypeOf<Readonly<Record<string, string>>>();
    expectTypeOf<ColumnField["labels"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<PreviewOptions["rows"]>().toEqualTypeOf<number>();
    expectTypeOf<ImportOptions<{ sku: string }>["batchSize"]>().toEqualTypeOf<number>();
    expectTypeOf<ImportReport["written"]>().toEqualTypeOf<number>();
    expectTypeOf<RevertOptions["window"]>().not.toBeAny();
    expectTypeOf<TabularPreview["sheets"][number]["header"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<WorkbookImportOptions["sheets"]>().toEqualTypeOf<
      readonly SheetImport<unknown>[]
    >();
    expectTypeOf<RevertTargets>().not.toBeAny();
    expectTypeOf<PayInput["employee"]>().toEqualTypeOf<string>();
    expectTypeOf<WarehouseSyncOptions["models"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<WarehouseSyncReport["files"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<ZipEntry["method"]>().toEqualTypeOf<"deflate" | "store" | undefined>();
  });

  it("runs an upload through preview, matching and import", async () => {
    const file = new TextEncoder().encode("﻿رمز المنتج,Price\r\nA-1,5\r\nA-2,7\r\n");
    const reader = new CsvReaderDriver();
    const preview = await previewTabular(reader, [file], { rows: 1 });
    const header = preview.sheets[0]?.header ?? [];
    const mapping = matchColumns(header, [
      { name: "sku", labels: ["رمز المنتج"] },
      { name: "price", labels: [] },
    ]);
    const written: { sku: string; price: number }[] = [];
    const report = await new ImportRunner(new MemoryImportLedgerDriver(), new SystemClock()).run({
      runId: "imp_1",
      rows: reader.read([file]),
      mapping,
      batchSize: 10,
      target: {
        schema: z.object({ sku: z.string(), price: z.coerce.number() }),
        upsert: async (records) => {
          written.push(...records);
          return records.map((record) => ({ key: record.sku, before: null }));
        },
        revert: async () => undefined,
      },
    });
    expect(report).toEqual({ runId: "imp_1", written: 2, errors: [] });
    expect(written).toEqual([
      { sku: "A-1", price: 5 },
      { sku: "A-2", price: 7 },
    ]);
  });
});
