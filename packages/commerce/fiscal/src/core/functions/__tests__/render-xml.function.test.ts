/**
 * Stackra file contract:
 * Purpose: unit tests of `renderXml`: canonical escapes, attribute order, expanded empty elements and skipped nulls.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { renderXml } from "#core/functions/render-xml.function";
import { xmlElement } from "#core/functions/xml-element.function";

describe("renderXml", () => {
  it("escapes text and attribute values", () => {
    expect(renderXml(xmlElement("a", { v: 'x"<&\n' }, "1 < 2 & 3 > 0"))).toBe(
      '<a v="x&quot;&lt;&amp;&#xA;">1 &lt; 2 &amp; 3 &gt; 0</a>',
    );
  });

  it("writes namespace declarations first, then attributes by name", () => {
    expect(renderXml(xmlElement("r", { z: "1", "xmlns:b": "B", a: "2", xmlns: "D" }))).toBe(
      '<r xmlns="D" xmlns:b="B" a="2" z="1"></r>',
    );
  });

  it("nests children and skips nulls", () => {
    expect(
      renderXml(xmlElement("a", {}, xmlElement("b", {}), null, xmlElement("c", {}, "t"))),
    ).toBe("<a><b></b><c>t</c></a>");
  });
});
