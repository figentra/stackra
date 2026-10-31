/**
 * Stackra file contract:
 * Purpose: `workbookParts`, the fixed parts of a written XLSX package for its sheet names: content types, the package
 *          and workbook relationships, the workbook and a style sheet whose style 1 shows a date and time.
 * Boundary: pure; internal to the XLSX writer. Sheet `n` (from 1) is `xl/worksheets/sheet<n>.xml`, written by the
 *           driver.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2); ECMA-376 part 1 (SpreadsheetML), part 2 (packaging).
 */
import { escapeXml } from "@stackra/support";

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PACKAGE_REL = "http://schemas.openxmlformats.org/package/2006/relationships";
const SHEET_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml";

/**
 * The fixed parts, path → XML, for a workbook of `names`.
 *
 * @example
 * workbookParts(["Orders", "Lines"])["xl/workbook.xml"];
 */
export function workbookParts(names: readonly string[]): Record<string, string> {
  const numbers = names.map((_, index) => index + 1);
  return {
    "[Content_Types].xml":
      `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      numbers
        .map(
          (n) => `<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="${SHEET_TYPE}"/>`,
        )
        .join("") +
      "</Types>",
    "_rels/.rels":
      `${XML}<Relationships xmlns="${PACKAGE_REL}">` +
      `<Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/>` +
      "</Relationships>",
    "xl/workbook.xml":
      `${XML}<workbook xmlns="${MAIN}" xmlns:r="${REL}"><sheets>` +
      names
        .map(
          (name, index) =>
            `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
        )
        .join("") +
      "</sheets></workbook>",
    "xl/_rels/workbook.xml.rels":
      `${XML}<Relationships xmlns="${PACKAGE_REL}">` +
      numbers
        .map(
          (n) =>
            `<Relationship Id="rId${n}" Type="${REL}/worksheet" Target="worksheets/sheet${n}.xml"/>`,
        )
        .join("") +
      `<Relationship Id="rId${names.length + 1}" Type="${REL}/styles" Target="styles.xml"/>` +
      "</Relationships>",
    "xl/styles.xml":
      `${XML}<styleSheet xmlns="${MAIN}">` +
      '<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm:ss"/></numFmts>' +
      '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>' +
      "</styleSheet>",
  };
}
