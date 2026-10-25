// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useEditor(options)`: one editor for the life of the component, opened from the first
 *          options, and a re-render with the new state on every change.
 * Boundary: test only; jsdom with Testing Library; plain block classes with schemas registered as gen does.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0270 (decision 4).
 */
import type { AnyClass } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { act, renderHook } from "@testing-library/react";
import { z } from "zod";

import type { EditorState } from "#contracts/index";
import { Editor } from "#core/index";
import { useEditor } from "#react/editor/use-editor";

class PageBlock {
  /** The page's heading. */
  title?: string;
}

registerSchemas([[PageBlock, z.object({})]]);

const BLOCKS = new Map<string, AnyClass>([["web.page", PageBlock]]);

/** A page with one section, as stored. */
const PAGE = { id: "page", block: "web.page", children: [{ id: "section", block: "web.page" }] };

describe("useEditor", () => {
  it("opens the document once and re-renders with each new state", () => {
    const { result, rerender } = renderHook(
      ({ root }: { readonly root: typeof PAGE }) => useEditor({ root, blocks: BLOCKS }),
      { initialProps: { root: PAGE } },
    );
    const [first, editor] = result.current;
    expect(editor).toBeInstanceOf(Editor);
    expect(first.root.children.map((child) => child.id)).toEqual(["section"]);
    act(() => {
      editor.insert("page", 0, "web.page");
    });
    const [next] = result.current;
    expect(next).not.toBe(first);
    expect(next.root.children).toHaveLength(2);
    rerender({ root: { ...PAGE, children: [] } });
    expect(result.current[1]).toBe(editor);
    expect(result.current[0].root.children).toHaveLength(2);
  });

  it("types the state and the editor", () => {
    expectTypeOf(useEditor).returns.toEqualTypeOf<readonly [EditorState, Editor]>();
  });
});
