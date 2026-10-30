/**
 * Stackra file contract:
 * Purpose: proves the web DropZone takes a file pasted on the page with `allowsPaste` (and leaves a paste into a text
 *          field alone), leaves out files of a type it does not accept, adds a "Take a photo" button with
 *          `allowsCamera`, and with `showPreviews` lists the files taken and removes one, revoking its preview.
 * Boundary: jsdom with real HeroUI and React Aria; the paste is a plain `paste` event carrying `clipboardData.files`,
 *           and `URL.createObjectURL` is a stub.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { DropZone } from "#react/drop-zone/drop-zone";

/** Pastes `files` on `target`. */
function paste(target: EventTarget, files: readonly File[]) {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { files } });
  act(() => {
    target.dispatchEvent(event);
  });
}

const SHOT = new File(["png"], "screenshot.png", { type: "image/png" });
const NOTES = new File(["txt"], "notes.txt", { type: "text/plain" });

describe("DropZone (web)", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  it("takes a file pasted on the page, but not one pasted into a text field", () => {
    const onSelect = vi.fn();
    render(
      <>
        <input aria-label="Note" />
        <DropZone allowsPaste acceptedFileTypes={["image/*"]} onSelect={onSelect} />
      </>,
    );
    expect(screen.getByText("You can also paste a file or a screenshot")).toBeTruthy();
    paste(screen.getByRole("textbox", { name: "Note" }), [SHOT]);
    expect(onSelect).not.toHaveBeenCalled();
    paste(document.body, [NOTES]);
    expect(onSelect).not.toHaveBeenCalled();
    paste(document.body, [SHOT]);
    expect(onSelect).toHaveBeenCalledWith([SHOT]);
  });

  it("ignores a page paste without allowsPaste and adds a camera button with allowsCamera", () => {
    const onSelect = vi.fn();
    render(<DropZone allowsCamera onSelect={onSelect} />);
    paste(document.body, [SHOT]);
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Take a photo/u })).toBeTruthy();
  });

  it("lists the files taken and removes one", () => {
    const onFilesChange = vi.fn();
    render(<DropZone allowsPaste allowsMultiple showPreviews onFilesChange={onFilesChange} />);
    paste(document.body, [SHOT, NOTES]);
    expect(onFilesChange).toHaveBeenLastCalledWith([SHOT, NOTES]);
    const list = screen.getByRole("list", { name: "Chosen files" });
    expect(list.textContent).toContain("screenshot.png");
    fireEvent.click(screen.getByRole("button", { name: "Remove screenshot.png" }));
    expect(onFilesChange).toHaveBeenLastCalledWith([NOTES]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });
});
