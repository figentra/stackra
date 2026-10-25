/**
 * Stackra file contract:
 * Purpose: `xmlElement`, the builder of an `XmlNode`: a name, attributes, then children.
 * Boundary: a pure function; nothing is escaped or rendered here (`renderXml` does that).
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */
import type { XmlNode } from "#core/types/xml-node.type";

/**
 * One element; pass `null` as a child to leave an optional element out.
 *
 * @example
 * xmlElement("cbc:PayableAmount", { currencyID: "SAR" }, "115.00");
 */
export function xmlElement(
  name: string,
  attributes: Readonly<Record<string, string>>,
  ...children: readonly (XmlNode | string | null)[]
): XmlNode {
  return { name, attributes, children };
}
