// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useInspector(editor)`: nothing selected gives no fields, a selected block gives its
 *          descriptors and current values, `set` edits through the editor (so undo reverts it) and the hook follows the
 *          selection and each edit.
 * Boundary: test only; jsdom with Testing Library; plain block classes with schemas registered as gen does.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0270 (decision 4).
 */
import type { AnyClass } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { act, renderHook } from "@testing-library/react";
import { z } from "zod";

import type { Inspector } from "#contracts/index";
import { Editor } from "#core/index";
import { useInspector } from "#react/inspector/use-inspector";

// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a bare block type for the test
class PageBlock {}

class HeroBlock {
  title!: string;
}

registerSchemas([
  [PageBlock, z.object({})],
  [HeroBlock, z.object({ title: z.string(), tone: z.enum(["calm", "bold"]).optional() })],
]);

/** page > hero, as stored. */
const PAGE = {
  id: "page",
  block: "web.page",
  children: [{ id: "hero", block: "web.hero", props: { title: "Hi" } }],
};

function open(): Editor {
  return Editor.create({
    root: PAGE,
    blocks: new Map<string, AnyClass>([
      ["web.page", PageBlock],
      ["web.hero", HeroBlock],
    ]),
  });
}

describe("useInspector", () => {
  it("is empty while nothing is selected", () => {
    const { result } = renderHook(() => useInspector(open()));
    expect(result.current.id).toBeUndefined();
    expect(result.current.fields).toEqual([]);
    expect(result.current.values).toEqual({});
    expect(() => result.current.set("title", "x")).not.toThrow();
  });

  it("describes the selected block and edits it through the editor", () => {
    const editor = open();
    const { result } = renderHook(() => useInspector(editor));
    act(() => editor.select(["hero"]));
    expect(result.current.id).toBe("hero");
    expect(result.current.fields.map((field) => [field.key, field.kind, field.required])).toEqual([
      ["title", "text", true],
      ["tone", "enum", false],
    ]);
    expect(result.current.values).toEqual({ title: "Hi" });

    act(() => result.current.set("title", "Hello"));
    expect(result.current.values).toEqual({ title: "Hello" });
    expect(editor.node("hero")?.props).toEqual({ title: "Hello" });

    act(() => result.current.set("tone", "bold"));
    act(() => result.current.set("tone", undefined));
    expect(result.current.values).toEqual({ title: "Hello" });

    // Three edits: the tone cleared, the tone set, the title set.
    act(() => {
      editor.undo();
      editor.undo();
      editor.undo();
    });
    expect(result.current.values).toEqual({ title: "Hi" });
  });

  it("follows the selection to another block", () => {
    const editor = open();
    const { result } = renderHook(() => useInspector(editor));
    act(() => editor.select(["hero"]));
    act(() => editor.select(["page"]));
    expect(result.current.id).toBe("page");
    expect(result.current.fields).toEqual([]);
  });

  it("types the inspector", () => {
    expectTypeOf(useInspector).returns.toEqualTypeOf<Inspector>();
  });
});
