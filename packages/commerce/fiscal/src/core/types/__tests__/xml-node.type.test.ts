/**
 * Stackra file contract:
 * Purpose: type tests of `XmlNode`: a node with text, element and null children; a numeric child does not type-check.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { XmlNode } from "#core/types/xml-node.type";

describe("XmlNode", () => {
  it("takes element, text and null children and refuses a number", () => {
    const leaf: XmlNode = { name: "b", attributes: {}, children: ["t"] };
    const node: XmlNode = { name: "a", attributes: { x: "1" }, children: [leaf, null] };
    // @ts-expect-error -- children are nodes, text or null
    const numeric: XmlNode = { name: "a", attributes: {}, children: [1] };
    expect([node.children.length, numeric.name]).toEqual([2, "a"]);
  });
});
