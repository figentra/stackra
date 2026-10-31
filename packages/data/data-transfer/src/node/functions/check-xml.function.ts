/**
 * Stackra file contract:
 * Purpose: `checkXml`, the guard every XLSX part passes before it is parsed: no DTD (so no entity can be declared or
 *          expanded: the parser only ever decodes the five named entities and character references) and no element
 *          nesting past the depth ceiling (STA-1736). A part's size is already bounded by `readZip`.
 * Boundary: pure; internal to the XLSX reader. Refuses as `UnreadableWorkbookError` (`doctype`, `too_deep`).
 * Runtime: node
 * Governing contract: ADR 0367 (decision 4); OWASP XXE prevention.
 */
import { UnreadableWorkbookError } from "#core/errors/unreadable-workbook.error";

/**
 * `xml`, once it has no DTD and nests no deeper than `depth`.
 *
 * @throws UnreadableWorkbookError when it has a DTD or nests too deep.
 * @example
 * checkXml(part("xl/workbook.xml"), 64);
 */
export function checkXml(xml: string, depth: number): string {
  if (/<!(?:DOCTYPE|ENTITY)/i.test(xml))
    throw UnreadableWorkbookError.create({ reason: "doctype" });
  let level = 0;
  // Comments and CDATA are dropped first (their text may look like tags); processing instructions (`<?`) open
  // nothing, and a self-closed element closes at once.
  const markup = xml.replaceAll(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->/g, "");
  for (const tag of markup.matchAll(/<(\/?)[^!?\s/>][^>]*?(\/?)>/g)) {
    if (tag[1] === "/") level--;
    else if (tag[2] !== "/" && ++level > depth)
      throw UnreadableWorkbookError.create({ reason: "too_deep" });
  }
  return xml;
}
