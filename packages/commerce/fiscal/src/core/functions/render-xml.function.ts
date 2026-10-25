/**
 * Stackra file contract:
 * Purpose: `renderXml`, an `XmlNode` written in canonical form (C14N 1.1 of the drivers' own output): no declaration,
 *          no whitespace between elements, namespace declarations first then attributes by name, empty elements as
 *          start and end tags, and the canonical escapes.
 * Boundary: a pure function. Hash-chained formats hash exactly this text, so its output for a given node never
 *           changes.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 3 and 8).
 */
import type { XmlNode } from "#core/types/xml-node.type";

/** Text content escapes. */
const text = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#xD;");

/** Attribute value escapes. */
const attribute = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/\t/g, "&#x9;")
    .replace(/\n/g, "&#xA;")
    .replace(/\r/g, "&#xD;");

/** Namespace declarations first (default before prefixed), then attributes, each group by name. */
const order = ([a]: [string, string], [b]: [string, string]): number => {
  const ns = (name: string) => (name === "xmlns" ? 0 : name.startsWith("xmlns:") ? 1 : 2);
  return ns(a) - ns(b) || (a < b ? -1 : a > b ? 1 : 0);
};

/**
 * The element as text.
 *
 * @example
 * renderXml(xmlElement("a", { b: "1" }, "x & y")); // '<a b="1">x &amp; y</a>'
 */
export function renderXml(node: XmlNode): string {
  const attributes = Object.entries(node.attributes)
    .sort(order)
    .map(([name, value]) => ` ${name}="${attribute(value)}"`)
    .join("");
  const children = node.children
    .map((child) =>
      child === null ? "" : typeof child === "string" ? text(child) : renderXml(child),
    )
    .join("");
  return `<${node.name}${attributes}>${children}</${node.name}>`;
}
