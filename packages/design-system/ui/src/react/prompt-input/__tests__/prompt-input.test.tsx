/**
 * Stackra file contract:
 * Purpose: proves the web PromptInput sends the trimmed text on Enter and clears, keeps Shift+Enter for a new line,
 *          refuses to send empty text or while a reply runs, turns its button into Stop while streaming, and hands
 *          dropped files on.
 * Boundary: jsdom with the real HeroUI button.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { PromptInput } from "#react/prompt-input/prompt-input";

const box = () => screen.getByRole("textbox", { name: "Message input" }) as HTMLTextAreaElement;

describe("PromptInput (web)", () => {
  it("sends the trimmed text on Enter, then clears", () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    fireEvent.change(box(), { target: { value: "  Summarise October  " } });
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("Summarise October");
    expect(box().value).toBe("");
  });

  it("keeps Shift+Enter for a new line and never sends empty text", () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    fireEvent.keyDown(box(), { key: "Enter" });
    fireEvent.change(box(), { target: { value: "Hi" } });
    fireEvent.keyDown(box(), { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Send message" }).hasAttribute("disabled")).toBe(
      false,
    );
  });

  it("locks the text and offers Stop while streaming", () => {
    const onSubmit = vi.fn();
    const onStop = vi.fn();
    render(<PromptInput onSubmit={onSubmit} onStop={onStop} status="streaming" defaultValue="Hi" />);
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(box().readOnly).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Stop generating" }));
    expect(onStop).toHaveBeenCalled();
  });

  it("hands dropped files on", () => {
    const onFilesDrop = vi.fn();
    const { container } = render(<PromptInput onSubmit={() => {}} onFilesDrop={onFilesDrop} />);
    const file = new File(["x"], "menu.pdf");
    const shell = box().parentElement as HTMLElement;
    fireEvent.dragOver(shell);
    expect(container.querySelector("[data-dragging]")).toBeTruthy();
    fireEvent.drop(shell, { dataTransfer: { files: [file] } });
    expect(onFilesDrop).toHaveBeenCalledWith([file]);
  });
});
