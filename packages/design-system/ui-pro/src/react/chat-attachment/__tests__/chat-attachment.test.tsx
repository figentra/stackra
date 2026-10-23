/**
 * Stackra file contract:
 * Purpose: proves the web ChatAttachment draws a file chip from HeroUI Pro's parts, names the remove button from
 *          `label` (and keeps HeroUI Pro's own name without one), presses it once, passes unknown props through,
 *          keeps `size` as the byte count, and carries HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { ChatAttachment as HeroChatAttachment } from "@heroui-pro/react/chat-attachment";
import { render, screen } from "@testing-library/react";

import { ChatAttachment } from "#react/chat-attachment/chat-attachment";

describe("ChatAttachment (web)", () => {
  it("draws a chip from the file data and passes unknown props through", () => {
    render(
      <ChatAttachment
        name="report.pdf"
        mimeType="application/pdf"
        size={2048}
        id="a"
        className="extra"
        data-testid="chip"
      >
        <ChatAttachment.Preview>
          <ChatAttachment.Icon />
        </ChatAttachment.Preview>
        <ChatAttachment.Info>
          <ChatAttachment.Name>report.pdf</ChatAttachment.Name>
          <ChatAttachment.Size>2 KB</ChatAttachment.Size>
        </ChatAttachment.Info>
      </ChatAttachment>,
    );
    const chip = screen.getByTestId("chip");
    expect(chip.id).toBe("a");
    expect(chip.classList.contains("extra")).toBe(true);
    expect(screen.getByText("report.pdf")).toBeTruthy();
    expect(screen.getByText("2 KB")).toBeTruthy();
  });

  it("draws HeroUI Pro's own content when it has no children", () => {
    render(<ChatAttachment name="notes.txt" size={100} data-testid="chip" />);
    expect(screen.getByTestId("chip").textContent).toContain("notes.txt");
  });

  it("names the remove button from label and presses once", () => {
    const onPress = vi.fn();
    render(
      <ChatAttachment name="a.png">
        <ChatAttachment.Remove label="Remove a.png" onPress={onPress} />
      </ChatAttachment>,
    );
    const button = screen.getByRole("button", { name: "Remove a.png" });
    expect(button.getAttribute("aria-label")).toBe("Remove a.png");
    button.click();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("keeps HeroUI Pro's own name on the remove button when no label is given", () => {
    render(
      <ChatAttachment name="a.png">
        <ChatAttachment.Remove data-testid="remove" />
      </ChatAttachment>,
    );
    expect(screen.getByTestId("remove").getAttribute("aria-label")).toBe("Close");
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of ["Preview", "Icon", "Info", "Name", "Size"] as const) {
      expect(ChatAttachment[part]).toBe(HeroChatAttachment[part]);
    }
  });
});
