/**
 * Stackra file contract:
 * Purpose: unit tests of `xmlElement`: a node with its name, attributes and children in order.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { xmlElement } from "#core/functions/xml-element.function";

describe("xmlElement", () => {
  it("builds a node and keeps null children for the renderer to skip", () => {
    const child = xmlElement("b", {});
    expect(xmlElement("a", { x: "1" }, child, null, "t")).toEqual({
      name: "a",
      attributes: { x: "1" },
      children: [child, null, "t"],
    });
  });
});
