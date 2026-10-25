/**
 * Stackra file contract:
 * Purpose: unit tests of `parseDocumentNode`: an experience node tree becomes a frozen editor tree (ids kept or derived
 *          from position, props and children defaulted, the query input kept, other keys dropped); a malformed tree
 *          is refused with every problem by path, within the depth and size bounds.
 * Boundary: test only; plain data, no registry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0270 (decision 1); ADR 0110.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { MAX_DOCUMENT_BLOCKS } from "#core/constants/max-document-blocks.constant";
import { MAX_DOCUMENT_DEPTH } from "#core/constants/max-document-depth.constant";
import { DocumentInvalidError } from "#core/errors/document-invalid.error";
import { parseDocumentNode } from "#core/functions/parse-document-node.function";

/** The field errors `parseDocumentNode(input)` refuses with. */
function refusalOf(input: unknown): Readonly<Record<string, string>> | undefined {
  try {
    parseDocumentNode(input);
  } catch (error) {
    if (isRefusal(error, DocumentInvalidError)) return error.fieldErrors;
    throw error;
  }
  return undefined;
}

describe("parseDocumentNode", () => {
  it("keeps ids, props, children and the query input, and drops other keys", () => {
    const root = parseDocumentNode({
      id: "page",
      block: "web.page",
      props: { title: { "en-US": "Home" } },
      children: [
        { id: "hero", block: "web.hero_section", props: {}, children: [], input: { limit: 3 } },
      ],
      style: "color: red",
    });
    expect(root).toEqual({
      id: "page",
      block: "web.page",
      props: { title: { "en-US": "Home" } },
      children: [
        { id: "hero", block: "web.hero_section", props: {}, children: [], input: { limit: 3 } },
      ],
    });
    expect(Object.isFrozen(root)).toBe(true);
    expect(Object.isFrozen(root.props)).toBe(true);
    expect(Object.isFrozen(root.children)).toBe(true);
  });

  it("opens an experience node: absent props and children default, absent ids derive from position", () => {
    const root = parseDocumentNode({
      block: "web.page",
      children: [{ block: "web.hero_section" }, { block: "web.faq_section" }],
    });
    expect(root).toEqual({
      id: "b0",
      block: "web.page",
      props: {},
      children: [
        { id: "b1", block: "web.hero_section", props: {}, children: [] },
        { id: "b2", block: "web.faq_section", props: {}, children: [] },
      ],
    });
    expect(
      parseDocumentNode({ block: "web.page", children: [{ block: "web.hero_section" }] }),
    ).toEqual(parseDocumentNode({ block: "web.page", children: [{ block: "web.hero_section" }] }));
  });

  it("keeps a __proto__ prop as data", () => {
    const root = parseDocumentNode(
      JSON.parse('{"block":"web.page","props":{"__proto__":{"x":1}}}'),
    );
    expect(Object.hasOwn(root.props, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(root.props)).toBe(Object.prototype);
  });

  it("refuses each malformed node and field by path", () => {
    expect(refusalOf("page")).toEqual({ "(root)": "node_invalid" });
    expect(
      refusalOf({
        id: "page",
        block: "Web Page",
        props: [],
        children: [{ id: "page", block: "web.hero_section" }, { id: "a.b", block: "web.x" }, 7],
      }),
    ).toEqual({
      block: "block_invalid",
      props: "props_invalid",
      "children.0.id": "id_taken",
      "children.1.id": "id_invalid",
      "children.2": "node_invalid",
    });
    expect(refusalOf({ block: "web.page", children: {} })).toEqual({
      children: "children_invalid",
    });
  });

  it("refuses a tree deeper than MAX_DOCUMENT_DEPTH", () => {
    let node: Record<string, unknown> = { block: "web.leaf" };
    for (let level = 1; level < MAX_DOCUMENT_DEPTH; level += 1)
      node = { block: "web.box", children: [node] };
    expect(() => parseDocumentNode(node)).not.toThrow();
    const deeper = { block: "web.box", children: [node] };
    const errors = refusalOf(deeper);
    expect(Object.values(errors ?? {})).toEqual(["too_deep"]);
  });

  it("refuses a tree of more than MAX_DOCUMENT_BLOCKS blocks", () => {
    const children = Array.from({ length: MAX_DOCUMENT_BLOCKS }, () => ({ block: "web.text" }));
    expect(refusalOf({ block: "web.page", children })).toEqual({ "(root)": "too_many_blocks" });
  });
});
