/**
 * Stackra file contract:
 * Purpose: `readWorkbook`, the sheet list, shared strings, date styles and date system of an unzipped XLSX package,
 *          found through its relationships (`_rels/.rels`, then the workbook's own rels), never by fixed paths.
 * Boundary: pure over the `part` reader; internal to the XLSX reader. A package without a workbook part is refused
 *           as `TypeError`, which the driver surfaces as a read failure.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2); ECMA-376 part 1 (SpreadsheetML), part 2 (relationships).
 */
import { isDateFormat } from "#node/functions/is-date-format.function";
import { runText } from "#node/functions/run-text.function";
import { xmlAttribute } from "#node/functions/xml-attribute.function";
import type { XlsxWorkbook } from "#node/types/xlsx-workbook.type";

/** Every start tag `<prefix:name ...>` of local name `name` in `xml`, as its attribute text. */
const tags = (xml: string, name: string): string[] =>
  [...xml.matchAll(new RegExp(`<(?:[\\w-]+:)?${name}\\b([^>]*)>`, "g"))].map(
    (match) => match[1] ?? "",
  );

/** The relationships of a rels part: id → zip path (resolved against `base`) and the type of each. */
function relationships(xml: string | undefined, base: string) {
  return (xml === undefined ? [] : tags(xml, "Relationship")).map((attributes) => {
    const target = xmlAttribute(attributes, "Target") ?? "";
    const parts = (target.startsWith("/") ? target.slice(1) : `${base}${target}`).split("/");
    const path: string[] = [];
    for (const part of parts)
      if (part === "..") path.pop();
      else if (part !== "." && part !== "") path.push(part);
    return {
      id: xmlAttribute(attributes, "Id") ?? "",
      type: xmlAttribute(attributes, "Type") ?? "",
      path: path.join("/"),
    };
  });
}

/**
 * The workbook of the package whose parts `part` reads.
 *
 * @param part - the text of a zip path, or `undefined` when the package has no such part.
 * @throws TypeError when the package has no workbook part.
 * @example
 * const book = readWorkbook((path) => texts.get(path));
 */
export function readWorkbook(part: (path: string) => string | undefined): XlsxWorkbook {
  const root = relationships(part("_rels/.rels"), "");
  const workbookPath = root.find((rel) => rel.type.endsWith("/officeDocument"))?.path;
  const workbook = workbookPath === undefined ? undefined : part(workbookPath);
  if (workbookPath === undefined || workbook === undefined)
    throw new TypeError("The file is not an XLSX workbook: it has no workbook part");
  const folder = workbookPath.slice(0, workbookPath.lastIndexOf("/") + 1);
  const rels = relationships(
    part(`${folder}_rels/${workbookPath.slice(folder.length)}.rels`),
    folder,
  );
  const pathOf = (suffix: string) => rels.find((rel) => rel.type.endsWith(suffix))?.path;

  const sheets = tags(workbook, "sheet").flatMap((attributes) => {
    const path = rels.find((rel) => rel.id === xmlAttribute(attributes, "id"))?.path;
    return path === undefined ? [] : [{ name: xmlAttribute(attributes, "name") ?? "", path }];
  });

  const sharedPath = pathOf("/sharedStrings");
  const shared = sharedPath === undefined ? undefined : part(sharedPath);
  const strings =
    shared === undefined
      ? []
      : [...shared.matchAll(/<(?:[\w-]+:)?si\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:[\w-]+:)?si>)/g)].map(
          (match) => runText(match[1] ?? ""),
        );

  const stylesPath = pathOf("/styles");
  const styles = stylesPath === undefined ? undefined : part(stylesPath);
  const codes = new Map(
    (styles === undefined ? [] : tags(styles, "numFmt")).map(
      (attributes) =>
        [
          Number(xmlAttribute(attributes, "numFmtId")),
          xmlAttribute(attributes, "formatCode"),
        ] as const,
    ),
  );
  const cellXfs = /<(?:[\w-]+:)?cellXfs\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?cellXfs>/.exec(
    styles ?? "",
  )?.[1];
  const dateStyles = new Set<number>();
  (cellXfs === undefined ? [] : tags(cellXfs, "xf")).forEach((attributes, index) => {
    const id = Number(xmlAttribute(attributes, "numFmtId") ?? 0);
    if (isDateFormat(id, codes.get(id))) dateStyles.add(index);
  });

  const properties = tags(workbook, "workbookPr")[0] ?? "";
  const date1904 = ["1", "true"].includes(xmlAttribute(properties, "date1904") ?? "");
  return { sheets, strings, dateStyles, date1904 };
}
