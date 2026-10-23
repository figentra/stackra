/**
 * Stackra file contract:
 * Purpose: proves the RichTextEditor page sits at /pro-rich-text-editor in the Pro group, titles the page and the
 *          document, draws three editors, each with a named toolbar and a named editing area, with the editable one
 *          writable and the disabled one not.
 * Boundary: jsdom with real HeroUI Pro and a real Tiptap editor; `matchMedia` and `ResizeObserver` are stubbed because
 *          jsdom has neither, and ProseMirror measures text with `Range.getClientRects` and `getBoundingClientRect`, which
 *          jsdom lacks, so both are stubbed to empty geometry.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProRichTextEditor } from "#src/routes/pro-rich-text-editor/pro-rich-text-editor";
import { ProRichTextEditorRoute } from "#src/routes/pro-rich-text-editor/pro-rich-text-editor.route";

describe("ProRichTextEditor", () => {
  beforeAll(() => {
    const emptyRect = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
    Object.defineProperty(Range.prototype, "getClientRects", { value: () => [] });
    Object.defineProperty(Range.prototype, "getBoundingClientRect", {
      value: () => ({ ...emptyRect, toJSON: () => emptyRect }),
    });
  });
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-rich-text-editor in the Pro group, and titles the page and the document", () => {
    render(<ProRichTextEditor />);
    expect(ProRichTextEditorRoute.path).toBe("/pro-rich-text-editor");
    expect(ProRichTextEditorRoute.category).toBe("Pro");
    expect(
      screen.getByRole("heading", { level: 1, name: ProRichTextEditorRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("RichTextEditor · Stackra Playground");
  });

  it("draws three named toolbars with their format and history buttons", () => {
    render(<ProRichTextEditor />);
    expect(screen.getAllByRole("toolbar")).toHaveLength(3);
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeTruthy();
    expect(screen.getByRole("toolbar", { name: "Formatting, disabled" })).toBeTruthy();
    expect(screen.getByRole("toolbar", { name: "Formatting, read only" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Bold" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Undo" })).toHaveLength(3);
  });

  it("names each editing area, writable only in the editable editor", () => {
    render(<ProRichTextEditor />);
    const editable = document.querySelector('[aria-label="Release notes, editable"]');
    const disabled = document.querySelector('[aria-label="Release notes, disabled"]');
    const readOnly = document.querySelector('[aria-label="Release notes, read only"]');
    expect(editable?.getAttribute("contenteditable")).toBe("true");
    expect(disabled?.getAttribute("contenteditable")).toBe("false");
    expect(readOnly?.getAttribute("contenteditable")).toBe("false");
  });
});
