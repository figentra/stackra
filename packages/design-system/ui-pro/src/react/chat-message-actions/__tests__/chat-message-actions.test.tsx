/**
 * Stackra file contract:
 * Purpose: proves the web ChatMessageActions names every preset action from `label` and presses it once, shows the
 *          copied state from `isCopied`, passes unknown props through, carries HeroUI Pro's own icons, and requires
 *          `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not
 *          looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { ChatMessageActions as HeroChatMessageActions } from "@heroui-pro/react/chat-message-actions";
import { render, screen } from "@testing-library/react";

import { ChatMessageActions } from "#react/chat-message-actions/chat-message-actions";

describe("ChatMessageActions (web)", () => {
  it("holds the actions in HeroUI Pro's row and passes unknown props through", () => {
    render(
      <ChatMessageActions id="r" className="extra" data-testid="row">
        <ChatMessageActions.Copy label="Copy" />
      </ChatMessageActions>,
    );
    const row = screen.getByTestId("row");
    expect(row.id).toBe("r");
    expect(row.classList.contains("extra")).toBe(true);
    expect(row.dataset["slot"]).toBe("chat-message-actions");
  });

  it.each([
    ["Copy", "Copy message"],
    ["Regenerate", "Regenerate reply"],
    ["Menu", "More options"],
    ["ThumbsUp", "Good reply"],
    ["ThumbsDown", "Bad reply"],
  ] as const)("%s is named from label and presses once", (part, label) => {
    const onPress = vi.fn();
    const Part = ChatMessageActions[part];
    render(<Part label={label} onPress={onPress} />);
    const button = screen.getByRole("button", { name: label });
    expect(button.getAttribute("aria-label")).toBe(label);
    expect(button.querySelector("svg")).toBeTruthy();
    button.click();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("shows the copied icon while isCopied is true", () => {
    const { rerender } = render(<ChatMessageActions.Copy label="Copy" isCopied={false} />);
    const copy = screen.getByRole("button", { name: "Copy" }).innerHTML;
    rerender(<ChatMessageActions.Copy label="Copy" isCopied />);
    expect(screen.getByRole("button", { name: "Copy" }).innerHTML).not.toBe(copy);
  });

  it("carries HeroUI Pro's own icons and requires a label", () => {
    for (const part of [
      "CopyIcon",
      "CopiedIcon",
      "RegenerateIcon",
      "MenuIcon",
      "ThumbsUpIcon",
      "ThumbsDownIcon",
    ] as const) {
      expect(ChatMessageActions[part]).toBe(HeroChatMessageActions[part]);
    }
    // @ts-expect-error `label` is required: HeroUI Pro's presets have no accessible name of their own
    void (<ChatMessageActions.ThumbsUp />);
  });
});
