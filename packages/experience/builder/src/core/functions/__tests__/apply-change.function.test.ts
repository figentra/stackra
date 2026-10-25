/**
 * Stackra file contract:
 * Purpose: unit tests of `applyChange`: each of the four changes gives the expected tree and an inverse that restores
 *          the tree before it; untouched subtrees are shared and the input is never mutated; indexes are clamped; a
 *          change naming a missing block, the root, a move into itself or a taken id is refused.
 * Boundary: test only; plain frozen trees.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0270 (decision 4).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { type EditorChange, EditorChangeKind, type EditorNode } from "#contracts/index";
import { BlockMoveInvalidError } from "#core/errors/block-move-invalid.error";
import { BlockNotFoundError } from "#core/errors/block-not-found.error";
import { DocumentInvalidError } from "#core/errors/document-invalid.error";
import { RootBlockLockedError } from "#core/errors/root-block-locked.error";
import { applyChange } from "#core/functions/apply-change.function";
import { parseDocumentNode } from "#core/functions/parse-document-node.function";

/** page > [hero, section > [text], footer], frozen. */
const PAGE = parseDocumentNode({
  id: "page",
  block: "web.page",
  children: [
    { id: "hero", block: "web.hero_section", props: { title: "Hi" } },
    { id: "section", block: "web.section", children: [{ id: "text", block: "web.text" }] },
    { id: "footer", block: "web.footer" },
  ],
});

/** The ids of `node`'s children. */
function childIds(node: EditorNode | undefined): readonly string[] {
  return node?.children.map((child) => child.id) ?? [];
}

/** What applying `change` to `PAGE` throws. */
function refusal(change: EditorChange): unknown {
  try {
    applyChange(PAGE, change);
  } catch (error) {
    return error;
  }
  return undefined;
}

/** `change` applied, then its inverse: the tree must come back equal. */
function roundTrip(change: EditorChange): EditorNode {
  const { root, inverse } = applyChange(PAGE, change);
  expect(applyChange(root, inverse).root).toEqual(PAGE);
  return root;
}

describe("applyChange", () => {
  it("inserts a block at a clamped position and reverts by removing it", () => {
    const node: EditorNode = { id: "cta", block: "web.cta_banner", props: {}, children: [] };
    const root = roundTrip({ kind: EditorChangeKind.Insert, parentId: "page", index: 1, node });
    expect(childIds(root)).toEqual(["hero", "cta", "section", "footer"]);
    const end = applyChange(PAGE, {
      kind: EditorChangeKind.Insert,
      parentId: "page",
      index: 99,
      node,
    });
    expect(childIds(end.root)).toEqual(["hero", "section", "footer", "cta"]);
    expect(end.inverse).toEqual({ kind: EditorChangeKind.Remove, id: "cta" });
  });

  it("removes a block with its subtree and reverts by inserting it back in place", () => {
    const { root, inverse } = applyChange(PAGE, { kind: EditorChangeKind.Remove, id: "section" });
    expect(childIds(root)).toEqual(["hero", "footer"]);
    expect(inverse).toEqual({
      kind: EditorChangeKind.Insert,
      parentId: "page",
      index: 1,
      node: PAGE.children[1],
    });
    expect(applyChange(root, inverse).root).toEqual(PAGE);
  });

  it("moves a block to another parent or position and reverts the move", () => {
    const into = roundTrip({
      kind: EditorChangeKind.Move,
      id: "hero",
      parentId: "section",
      index: 0,
    });
    expect(childIds(into)).toEqual(["section", "footer"]);
    expect(childIds(into.children[0])).toEqual(["hero", "text"]);
    const reordered = roundTrip({
      kind: EditorChangeKind.Move,
      id: "hero",
      parentId: "page",
      index: 2,
    });
    expect(childIds(reordered)).toEqual(["section", "footer", "hero"]);
  });

  it("sets and clears a prop and reverts to the previous value", () => {
    const set = roundTrip({
      kind: EditorChangeKind.SetProp,
      id: "hero",
      name: "title",
      value: "Hello",
    });
    expect(set.children[0]?.props).toEqual({ title: "Hello" });
    const cleared = roundTrip({
      kind: EditorChangeKind.SetProp,
      id: "hero",
      name: "title",
      value: undefined,
    });
    expect(cleared.children[0]?.props).toEqual({});
    const added = applyChange(PAGE, {
      kind: EditorChangeKind.SetProp,
      id: "footer",
      name: "note",
      value: null,
    });
    expect(added.inverse).toEqual({
      kind: EditorChangeKind.SetProp,
      id: "footer",
      name: "note",
      value: undefined,
    });
  });

  it("shares untouched subtrees, freezes new nodes and never mutates its input", () => {
    const before = JSON.stringify(PAGE);
    const { root } = applyChange(PAGE, {
      kind: EditorChangeKind.SetProp,
      id: "hero",
      name: "title",
      value: "x",
    });
    expect(JSON.stringify(PAGE)).toBe(before);
    expect(root.children[1]).toBe(PAGE.children[1]);
    expect(root.children[2]).toBe(PAGE.children[2]);
    expect(Object.isFrozen(root)).toBe(true);
    expect(Object.isFrozen(root.children[0]?.props)).toBe(true);
  });

  it("refuses what cannot apply, before anything changes", () => {
    expect(
      isRefusal(refusal({ kind: EditorChangeKind.Remove, id: "nope" }), BlockNotFoundError),
    ).toBe(true);
    expect(
      isRefusal(
        refusal({ kind: EditorChangeKind.Move, id: "hero", parentId: "nope", index: 0 }),
        BlockNotFoundError,
      ),
    ).toBe(true);
    expect(
      isRefusal(refusal({ kind: EditorChangeKind.Remove, id: "page" }), RootBlockLockedError),
    ).toBe(true);
    expect(
      isRefusal(
        refusal({ kind: EditorChangeKind.Move, id: "page", parentId: "hero", index: 0 }),
        RootBlockLockedError,
      ),
    ).toBe(true);
    expect(
      isRefusal(
        refusal({ kind: EditorChangeKind.Move, id: "section", parentId: "text", index: 0 }),
        BlockMoveInvalidError,
      ),
    ).toBe(true);
    expect(
      isRefusal(
        refusal({ kind: EditorChangeKind.Move, id: "section", parentId: "section", index: 0 }),
        BlockMoveInvalidError,
      ),
    ).toBe(true);
    const taken = refusal({
      kind: EditorChangeKind.Insert,
      parentId: "page",
      index: 0,
      node: { id: "text", block: "web.text", props: {}, children: [] },
    });
    expect(isRefusal(taken, DocumentInvalidError) && taken.fieldErrors).toEqual({
      text: "id_taken",
    });
  });
});
