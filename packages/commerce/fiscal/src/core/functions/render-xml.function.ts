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
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r", "&#xD;");

/** Attribute value escapes. */
const attribute = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;")
    .replaceAll("\t", "&#x9;")
    .replaceAll("\n", "&#xA;")
    .replaceAll("\r", "&#xD;");

/** 0 for the default namespace declaration, 1 for a prefixed one, 2 for an attribute. */
const namespaceRank = (name: string) => (name === "xmlns" ? 0 : name.startsWith("xmlns:") ? 1 : 2);

/** Namespace declarations first (default before prefixed), then attributes, each group by name. */
const order = ([a]: [string, string], [b]: [string, string]): number => {
  return namespaceRank(a) - namespaceRank(b) || (a < b ? -1 : a > b ? 1 : 0);
};

/**
 * The element as text.
 *
 * @example
 * renderXml(xmlElement("a", { b: "1" }, "x & y")); // '<a b="1">x &amp; y</a>'
 */
export function renderXml(node: XmlNode): string {
  const attributes = Object.entries(node.attributes)
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
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
