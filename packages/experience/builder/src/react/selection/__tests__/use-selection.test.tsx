// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useSelection(editor)`: the selected ids, re-rendered when the selection changes and
 *          not when another edit leaves it alone.
 * Boundary: test only; jsdom with Testing Library; plain block classes with schemas registered as gen does.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0270 (decision 4).
 */
import type { AnyClass } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { act, renderHook } from "@testing-library/react";
import { z } from "zod";

import { Editor } from "#core/index";
import { useSelection } from "#react/selection/use-selection";

class PageBlock {
  /** The page's heading. */
  title?: string;
}

registerSchemas([[PageBlock, z.object({})]]);

/** A page with two sections, as stored. */
const PAGE = {
  id: "page",
  block: "web.page",
  children: [
    { id: "one", block: "web.page" },
    { id: "two", block: "web.page" },
  ],
};

describe("useSelection", () => {
  it("follows the selection only", () => {
    const editor = Editor.create({
      root: PAGE,
      blocks: new Map<string, AnyClass>([["web.page", PageBlock]]),
    });
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useSelection(editor);
    });
    expect(result.current).toEqual([]);
    act(() => editor.select(["two"]));
    expect(result.current).toEqual(["two"]);
    const settled = renders;
    act(() => editor.setProp("one", "note", "x"));
    expect(renders).toBe(settled);
    act(() => editor.remove("two"));
    expect(result.current).toEqual([]);
  });

  it("types the ids", () => {
    expectTypeOf(useSelection).returns.toEqualTypeOf<readonly string[]>();
  });
});
