/**
 * Stackra file contract:
 * Purpose: proves the web RichTextEditor names its text box and toolbar, reports the document as JSON or HTML after a
 *          toolbar command, follows a controlled value, marks every block `dir="auto"` for Arabic, counts characters
 *          against a limit, hides the toolbar when read-only, and takes contributions (extensions' buttons and panels)
 *          only for the document kinds they name.
 * Boundary: jsdom with real TipTap and HeroUI; English words from the catalogue. Text is put in through a contributed
 *           button that holds the editor, since jsdom does not run the browser's editing.
 * Runtime: browser
 * Governing contract: ADR 0466 (decisions 3 and 8); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import type { Editor } from "@tiptap/core";
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { RichTextContribution } from "#react/rich-text-editor/rich-text-contribution.type";
import { RichTextEditor } from "#react/rich-text-editor/rich-text-editor";

const HELLO = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }],
} as const;

/** A contribution whose button hands the editor to the test. */
const grab = (kinds?: readonly string[]) => {
  const held: { editor?: Editor } = {};
  const contribution: RichTextContribution = {
    id: "test.grab",
    ...(kinds ? { kinds } : {}),
    toolbar: [
      {
        id: "grab",
        label: "Grab",
        icon: "sparkles",
        onPress: (editor) => {
          held.editor = editor;
        },
      },
    ],
    panel: (editor) => <p>Panel: {editor.getText().length}</p>,
  };
  return { held, contribution };
};

describe("RichTextEditor (web)", () => {
  it("names the box and toolbar and reports JSON after a toolbar command", () => {
    const onChange = vi.fn();
    const { held, contribution } = grab();
    render(
      <RichTextEditor
        label="Description"
        defaultValue={HELLO}
        onChange={onChange}
        contributions={[contribution]}
      />,
    );
    const box = screen.getByRole("textbox", { name: "Description" });
    expect(box.textContent).toBe("Hello");
    const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
    expect(toolbar).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Grab" }));
    act(() => {
      held.editor?.commands.selectAll();
    });
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(onChange).toHaveBeenLastCalledWith({
      type: "doc",
      attrs: { dir: "auto" },
      content: [
        {
          type: "paragraph",
          attrs: { dir: "auto" },
          content: [{ type: "text", text: "Hello", marks: [{ type: "bold" }] }],
        },
      ],
    });
    expect(screen.getByRole("button", { name: "Bold", pressed: true })).toBeTruthy();
    expect(screen.getByText("Panel: 5")).toBeTruthy();
  });

  it("follows a controlled HTML value, reports HTML and marks blocks dir=auto", () => {
    const onChange = vi.fn();
    const { held, contribution } = grab();
    const { rerender } = render(
      <RichTextEditor
        aria-label="Body"
        format="html"
        value="<p>مرحبا</p>"
        onChange={onChange}
        contributions={[contribution]}
      />,
    );
    const box = screen.getByRole("textbox", { name: "Body" });
    expect(box.querySelector("p")?.getAttribute("dir")).toBe("auto");
    rerender(
      <RichTextEditor
        aria-label="Body"
        format="html"
        value="<h2>Title</h2><script>alert(1)</script>"
        onChange={onChange}
        contributions={[contribution]}
      />,
    );
    expect(box.querySelector("h2")?.textContent).toBe("Title");
    expect(box.querySelector("script")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Grab" }));
    act(() => {
      held.editor?.commands.selectAll();
    });
    fireEvent.click(screen.getByRole("button", { name: "Italic" }));
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining("<em>Title</em>"));
  });

  it("counts characters against the limit and hides the toolbar when read-only", () => {
    render(
      <RichTextEditor aria-label="Note" defaultValue={HELLO} characterLimit={10} isReadOnly />,
    );
    expect(screen.getByText("5 / 10")).toBeTruthy();
    expect(screen.queryByRole("toolbar")).toBeNull();
    const box = screen.getByRole("textbox", { name: "Note" });
    expect(box.getAttribute("aria-readonly")).toBe("true");
    expect(box.getAttribute("contenteditable")).toBe("false");
  });

  it("skips a contribution for another document kind", () => {
    const { contribution } = grab(["email"]);
    render(<RichTextEditor aria-label="Post" documentKind="post" contributions={[contribution]} />);
    expect(screen.queryByRole("button", { name: "Grab" })).toBeNull();
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
  });
  it("gives an Arabic list the direction of its text, so its numbers sit at the right", () => {
    render(
      <RichTextEditor
        aria-label="List"
        defaultValue="<ol><li><p>أولًا</p></li></ol><ul><li><p>First</p></li></ul>"
      />,
    );
    const box = screen.getByRole("textbox", { name: "List" });
    expect(box.querySelector("ol")?.getAttribute("dir")).toBe("rtl");
    expect(box.querySelector("ol li")?.getAttribute("dir")).toBe("rtl");
    expect(box.querySelector("ul")?.getAttribute("dir")).toBe("ltr");
  });
});
