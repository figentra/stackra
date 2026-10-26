/**
 * Stackra file contract:
 * Purpose: unit tests of `DocumentEditor`: a change replaces the document as one undoable step, undo and redo walk the
 *          history and clear the redo on a new change, a same-reference change does nothing, `problems()` runs the
 *          kind's check on the current document, and subscribers hear every change until they unsubscribe.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0426 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { DocumentEditor } from "#core/values/document-editor.value";

type Draft = { readonly steps: readonly string[] };

const check = (draft: Draft) => (draft.steps.length === 0 ? { steps: "too_small" } : {});

describe(DocumentEditor, () => {
  it("changes, undoes and redoes whole documents", () => {
    const first: Draft = { steps: ["ask"] };
    const editor = DocumentEditor.create({ document: first, check });
    expect(editor.state).toEqual({ document: first, canUndo: false, canRedo: false });
    const second = { steps: ["ask", "thank"] };
    editor.change(second);
    expect(editor.state).toEqual({ document: second, canUndo: true, canRedo: false });
    editor.undo();
    expect(editor.state).toEqual({ document: first, canUndo: false, canRedo: true });
    editor.redo();
    expect(editor.state.document).toBe(second);
    editor.undo();
    editor.change({ steps: [] });
    expect(editor.state.canRedo).toBe(false);
    editor.redo();
    expect(editor.state.document).toEqual({ steps: [] });
  });

  it("ignores a same-reference change and an empty undo or redo", () => {
    const first: Draft = { steps: ["ask"] };
    const editor = DocumentEditor.create({ document: first, check });
    const before = editor.state;
    editor.change(first);
    editor.undo();
    editor.redo();
    expect(editor.state).toBe(before);
  });

  it("reports the check's problems for the current document", () => {
    const editor = DocumentEditor.create<Draft>({ document: { steps: ["ask"] }, check });
    expect(editor.problems()).toEqual({});
    editor.change({ steps: [] });
    expect(editor.problems()).toEqual({ steps: "too_small" });
  });

  it("notifies subscribers until they unsubscribe", () => {
    const editor = DocumentEditor.create<Draft>({ document: { steps: [] }, check });
    let heard = 0;
    const stop = editor.subscribe(() => {
      heard += 1;
    });
    editor.change({ steps: ["a"] });
    editor.undo();
    stop();
    editor.redo();
    expect(heard).toBe(2);
  });
});
