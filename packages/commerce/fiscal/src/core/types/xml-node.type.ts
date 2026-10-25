/**
 * Stackra file contract:
 * Purpose: `XmlNode`, one element of the XML the drivers build: a qualified name, attributes in order, and children
 *          that are elements, text, or `null` for an optional element left out.
 * Boundary: a type only; `xmlElement` builds one and `renderXml` writes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */

/** An element; text children are escaped when rendered. */
export type XmlNode = {
  /** Qualified name (`cbc:ID`). */
  readonly name: string;
  /** Attributes, namespace declarations included. */
  readonly attributes: Readonly<Record<string, string>>;
  /** Child elements and text; `null` entries are skipped. */
  readonly children: readonly (XmlNode | string | null)[];
};
