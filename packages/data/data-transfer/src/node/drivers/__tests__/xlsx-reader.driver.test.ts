/**
 * Stackra file contract:
 * Purpose: unit tests of `XlsxReaderDriver`: every sheet of a workbook (written by `XlsxWriterDriver`) streamed with
 *          names, row numbers and text cells, a chosen sheet, and the row limit; and a workbook laid out as Excel
 *          writes one (shared strings with rich and phonetic runs, a custom and a built-in date style, formulas with
 *          and without a cached result, an error, a gap and a sheet part found through the relationships); 1904 dates;
 *          the refusals of an untrusted upload (a DTD, a column past XFD, the caller's column and cell-length limits);
 *          and the shipped zenhr-xlsx payroll export read back cell for cell (STA-1736).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decisions 2 and 4).
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "@stackra/testing";
import { parse } from "yaml";

import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { TabularReadOptions } from "#contracts/types/tabular-read-options.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import { XlsxReaderDriver } from "#node/drivers/xlsx-reader.driver";
import { XlsxWriterDriver } from "#node/drivers/xlsx-writer.driver";
import { PAYROLL_EXPORT_PROFILE_SCHEMA } from "#core/constants/payroll-export-profile-schema.constant";
import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";
import { UnreadableWorkbookError } from "#core/errors/unreadable-workbook.error";
import { payrollSheet } from "#core/functions/payroll-sheet.function";
import type { PayInput } from "#core/types/pay-input.type";
import { writeZip } from "#core/functions/write-zip.function";

async function workbook(): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of new XlsxWriterDriver().write([
    {
      name: "المنتجات",
      rows: [
        ["الاسم", "السعر"],
        ["قلم", 5],
        ["دفتر", 12],
      ],
    },
    { name: "Notes", rows: [["note"], [true]] },
  ]))
    chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function rows(options?: TabularReadOptions): Promise<TabularRow[]> {
  const result: TabularRow[] = [];
  for await (const row of new XlsxReaderDriver().read([await workbook()], options))
    result.push(row);
  return result;
}

describe("XlsxReaderDriver", () => {
  it("streams every sheet", async () => {
    expect(await rows()).toEqual([
      { sheet: "المنتجات", row: 1, cells: ["الاسم", "السعر"] },
      { sheet: "المنتجات", row: 2, cells: ["قلم", "5"] },
      { sheet: "المنتجات", row: 3, cells: ["دفتر", "12"] },
      { sheet: "Notes", row: 1, cells: ["note"] },
      { sheet: "Notes", row: 2, cells: ["true"] },
    ]);
  });

  it("reads only the chosen sheets", async () => {
    expect((await rows({ sheets: ["Notes"] })).map((row) => row.sheet)).toEqual(["Notes", "Notes"]);
  });

  it("refuses past the row limit", async () => {
    expect(await rows({ limits: { rows: 3 } })).toHaveLength(5);
    await expect(rows({ limits: { rows: 2 } })).rejects.toThrow(TransferLimitExceededError);
  });
});

/** `files` zipped. */
async function zipOf(files: Readonly<Record<string, string>>): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const entries = Object.entries(files).map(([name, xml]) => ({
    name,
    bytes: [encoder.encode(xml)],
  }));
  const chunks: Uint8Array[] = [];
  for await (const chunk of writeZip(entries, new Date(Date.UTC(2026, 9, 25)))) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/** A workbook as Excel lays it out, built part by part. */
function excelWorkbook(overrides: Readonly<Record<string, string>> = {}): Promise<Uint8Array> {
  const rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const parts: Record<string, string> = {
    "_rels/.rels": `<Relationships><Relationship Id="rId1" Type="${rel}/officeDocument" Target="/xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml":
      `<workbook xmlns:r="${rel}"><workbookPr/><sheets>` +
      '<sheet name="Q&amp;A" sheetId="7" r:id="rId3"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      `<Relationships><Relationship Id="rId3" Type="${rel}/worksheet" Target="worksheets/data.xml"/>` +
      `<Relationship Id="rId8" Type="${rel}/sharedStrings" Target="sharedStrings.xml"/>` +
      `<Relationship Id="rId9" Type="${rel}/styles" Target="../xl/styles.xml"/></Relationships>`,
    "xl/sharedStrings.xml":
      "<sst><si><t>name</t></si><si><r><rPr/><t>مر</t></r><r><t>حبا</t></r>" +
      '<rPh sb="0" eb="1"><t>x</t></rPh></si></sst>',
    "xl/styles.xml":
      '<styleSheet><numFmts count="1"><numFmt numFmtId="165" formatCode="[$-409]d/m/yyyy;@"/></numFmts>' +
      '<cellXfs count="3"><xf numFmtId="0"/><xf numFmtId="165"/><xf numFmtId="14"/></cellXfs></styleSheet>',
    "xl/worksheets/data.xml":
      "<worksheet><sheetData>" +
      '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="s"><v>1</v></c></row>' +
      '<row r="2" spans="1:3"/>' +
      '<row r="4"><c r="A4" s="1"><v>46320</v></c><c r="B4" s="2"><v>46320.5</v></c>' +
      '<c r="C4"><f>A1*2</f><v>4</v></c><c r="D4"><f>A1*3</f></c>' +
      '<c r="E4" t="e"><v>#DIV/0!</v></c><c r="F4" t="b"><v>1</v></c>' +
      '<c r="G4" t="str"><f>"a"&amp;"b"</f><v>ab</v></c><c r="H4"><v>0.25</v></c></row>' +
      "</sheetData></worksheet>",
  };
  return zipOf({ ...parts, ...overrides });
}

describe("XlsxReaderDriver on a workbook laid out as Excel writes one (STA-1736)", () => {
  it("reads strings, dates, formulas, errors and gaps as text", async () => {
    const result: TabularRow[] = [];
    for await (const row of new XlsxReaderDriver().read([await excelWorkbook()])) result.push(row);
    expect(result).toEqual([
      { sheet: "Q&A", row: 1, cells: ["name", "", "مرحبا"] },
      {
        sheet: "Q&A",
        row: 4,
        cells: [
          "2026-10-25T00:00:00.000Z",
          "2026-10-25T12:00:00.000Z",
          "4",
          "",
          "#DIV/0!",
          "true",
          "ab",
          "0.25",
        ],
      },
    ]);
  });

  it("refuses a file that is not a workbook", async () => {
    const empty = await zipOf({ "readme.txt": "no workbook" });
    expect(await refusalOf([empty])).toBe("not_a_workbook");
  });
});

/** The rows of a workbook whose sheet holds `cells` (row 1), with `workbookPart` as its workbook part when given. */
async function readSheet(cells: string, options?: TabularReadOptions, workbookPart?: string) {
  const bytes = await excelWorkbook({
    "xl/worksheets/data.xml": `<worksheet><sheetData><row r="1">${cells}</row></sheetData></worksheet>`,
    ...(workbookPart === undefined ? {} : { "xl/workbook.xml": workbookPart }),
  });
  const result: TabularRow[] = [];
  for await (const row of new XlsxReaderDriver().read([bytes], options)) result.push(row);
  return result;
}

/** The `UnreadableWorkbookError` reason reading `source` refuses with, or the rows' count when it reads. */
async function refusalOf(source: readonly Uint8Array[]): Promise<string | number> {
  let count = 0;
  try {
    for await (const row of new XlsxReaderDriver().read(source))
      count += row.cells.length > 0 ? 1 : 0;
  } catch (error) {
    if (error instanceof UnreadableWorkbookError) return error.reason;
    throw error;
  }
  return count;
}

describe("XlsxReaderDriver on an untrusted upload (STA-1736)", () => {
  const rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

  it("reads dates in the 1904 date system", async () => {
    const part =
      `<workbook xmlns:r="${rel}"><workbookPr date1904="1"/><sheets>` +
      '<sheet name="Q&amp;A" sheetId="7" r:id="rId3"/></sheets></workbook>';
    expect(await readSheet('<c r="A1" s="1"><v>44856</v></c>', undefined, part)).toEqual([
      { sheet: "Q&A", row: 1, cells: ["2026-10-23T00:00:00.000Z"] },
    ]);
  });

  it("refuses a DTD in a part (no entity is ever expanded)", async () => {
    const part = `<!DOCTYPE w [<!ENTITY x SYSTEM "file:///etc/passwd">]><workbook>&x;</workbook>`;
    const bytes = await excelWorkbook({ "xl/workbook.xml": part });
    expect(await refusalOf([bytes])).toBe("doctype");
  });

  it("refuses a cell past the last column (XFD) before allocating its gap", async () => {
    const bytes = await excelWorkbook({
      "xl/worksheets/data.xml":
        '<worksheet><sheetData><row r="1"><c r="XFE1"><v>1</v></c></row></sheetData></worksheet>',
    });
    expect(await refusalOf([bytes])).toBe("too_many_columns");
    expect(await readSheet('<c r="XFD1"><v>1</v></c>')).toHaveLength(1);
  });

  it("refuses past the caller's column and cell-length limits", async () => {
    const cells =
      '<c r="A1" t="inlineStr"><is><t>abcd</t></is></c><c r="B1"><v>1</v></c><c r="C1"><v>2</v></c>';
    expect(await readSheet(cells, { limits: { columns: 3, cellLength: 4 } })).toHaveLength(1);
    await expect(readSheet(cells, { limits: { columns: 2 } })).rejects.toMatchObject({
      limit: "columns",
      max: 2,
    });
    await expect(readSheet(cells, { limits: { cellLength: 3 } })).rejects.toMatchObject({
      limit: "cell_length",
      max: 3,
    });
    await expect(readSheet(cells, { limits: { cellLength: 3 } })).rejects.toBeInstanceOf(
      TransferLimitExceededError,
    );
  });
});

describe("XLSX round trip of the shipped payroll export profile (STA-1736)", () => {
  it("reads back what the zenhr-xlsx export writes, cell for cell", async () => {
    const record = parse(
      readFileSync(
        new URL("../../../../assets/data/payroll-export-profiles/zenhr-xlsx.yaml", import.meta.url),
        "utf8",
      ),
    ) as { rows: { value: unknown }[] };
    const profile = {
      ...PAYROLL_EXPORT_PROFILE_SCHEMA.parse(record.rows[0]?.value),
      codes: { "hours.regular": "OT-1", commission: "COM" },
    };
    const inputs: PayInput[] = [
      {
        employee: "E-7",
        item: "hours.regular",
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        amount: 812.5,
        currency: "AED",
      },
      {
        employee: "م-12",
        item: "commission",
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        amount: 0.1,
        currency: "SAR",
      },
    ];
    const written: (readonly TabularCell[])[] = [];
    for await (const row of payrollSheet(profile, inputs).rows) written.push(row);

    const chunks: Uint8Array[] = [];
    for await (const chunk of new XlsxWriterDriver().write([payrollSheet(profile, inputs)]))
      chunks.push(chunk);
    const read: TabularRow[] = [];
    for await (const row of new XlsxReaderDriver().read([Buffer.concat(chunks)])) read.push(row);

    expect(read.map((row) => row.sheet)).toEqual(written.map(() => profile.sheet));
    expect(read.map((row) => row.cells)).toEqual(
      written.map((cells) => cells.map((cell) => (cell === null ? "" : String(cell)))),
    );
  });
});
