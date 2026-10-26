/**
 * Stackra file contract:
 * Purpose: proves the web ChatAttachmentInput maps `isDisabled` to HeroUI Pro's `disabled` on the picker and on the
 *          trigger, names the trigger from `label`, hands dropped files to `onFilesSelected`, and carries HeroUI
 *          Pro's dropzone.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { ChatAttachmentInput as HeroChatAttachmentInput } from "@heroui-pro/react/chat-attachment";
import { fireEvent, render, screen } from "@testing-library/react";

import { ChatAttachmentInput } from "#react/chat-attachment/chat-attachment-input";
import type { ChatAttachmentInputProps } from "#react/chat-attachment/chat-attachment-input.props";

describe("ChatAttachmentInput (web)", () => {
  it("names the trigger from label", () => {
    render(
      <ChatAttachmentInput onFilesSelected={vi.fn()}>
        <ChatAttachmentInput.Trigger label="Attach files" data-testid="trigger" />
      </ChatAttachmentInput>,
    );
    const trigger = screen.getByRole("button", { name: "Attach files" });
    expect(trigger.getAttribute("aria-label")).toBe("Attach files");
  });

  it("maps isDisabled to disabled on the trigger", () => {
    render(
      <ChatAttachmentInput onFilesSelected={vi.fn()}>
        <ChatAttachmentInput.Trigger label="Attach" isDisabled />
      </ChatAttachmentInput>,
    );
    expect((screen.getByRole("button", { name: "Attach" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("maps isDisabled on the root to HeroUI Pro's disabled, which stops the file dialog opening", () => {
    const open = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    const { rerender } = render(
      <ChatAttachmentInput onFilesSelected={vi.fn()} isDisabled>
        <ChatAttachmentInput.Trigger label="Attach" />
      </ChatAttachmentInput>,
    );
    screen.getByRole("button", { name: "Attach" }).click();
    expect(open).not.toHaveBeenCalled();
    rerender(
      <ChatAttachmentInput onFilesSelected={vi.fn()}>
        <ChatAttachmentInput.Trigger label="Attach" />
      </ChatAttachmentInput>,
    );
    screen.getByRole("button", { name: "Attach" }).click();
    expect(open).toHaveBeenCalledOnce();
    open.mockRestore();
  });

  it("hands dropped files to onFilesSelected through HeroUI Pro's dropzone", () => {
    const onFilesSelected = vi.fn();
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    render(
      <ChatAttachmentInput onFilesSelected={onFilesSelected} multiple>
        <ChatAttachmentInput.Dropzone data-testid="zone">drop here</ChatAttachmentInput.Dropzone>
      </ChatAttachmentInput>,
    );
    fireEvent.drop(screen.getByTestId("zone"), {
      dataTransfer: { files: [file], types: ["Files"] },
    });
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it("carries HeroUI Pro's own dropzone and the vocabulary's disabled name", () => {
    expect(ChatAttachmentInput.Dropzone).toBe(HeroChatAttachmentInput.Dropzone);
    expectTypeOf<ChatAttachmentInputProps>().not.toHaveProperty("disabled");
    expectTypeOf<ChatAttachmentInputProps>().toHaveProperty("isDisabled");
  });
});
