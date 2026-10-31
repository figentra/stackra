/**
 * Stackra file contract:
 * Purpose: unit tests of `XlsxReaderDriver`: every sheet of a workbook (written by `XlsxWriterDriver`) streamed with
 *          names, row numbers and text cells, a chosen sheet, and the row limit; and a workbook laid out as Excel
 *          writes one (shared strings with rich and phonetic runs, a custom and a built-in date style, formulas with
 *          and without a cached result, an error, a gap and a sheet part found through the relationships, STA-1736).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decisions 2 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import type { TabularReadOptions } from "#contracts/types/tabular-read-options.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import { XlsxReaderDriver } from "#node/drivers/xlsx-reader.driver";
import { XlsxWriterDriver } from "#node/drivers/xlsx-writer.driver";
import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";
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
function excelWorkbook(): Promise<Uint8Array> {
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
  return zipOf(parts);
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
    await expect(new XlsxReaderDriver().read([empty]).next()).rejects.toThrow(
      /not an XLSX workbook/,
    );
  });
});
