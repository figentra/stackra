// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `useDocumentEditor(options)`: one editor for the life of the component, opened from the first
 *          options, and a re-render with the new state on every change.
 * Boundary: test only; jsdom with Testing Library.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0426 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";

import { useDocumentEditor } from "#react/document-editor/use-document-editor";

const check = () => ({});

describe(useDocumentEditor, () => {
  it("keeps one editor and re-renders on each change", () => {
    const { result, rerender } = renderHook(
      ({ document }: { readonly document: { readonly name: string } }) =>
        useDocumentEditor({ document, check }),
      { initialProps: { document: { name: "first" } } },
    );
    const [, editor] = result.current;
    rerender({ document: { name: "ignored" } });
    expect(result.current[1]).toBe(editor);
    expect(result.current[0].document).toEqual({ name: "first" });
    act(() => editor.change({ name: "second" }));
    expect(result.current[0]).toEqual({
      document: { name: "second" },
      canUndo: true,
      canRedo: false,
    });
  });
});
