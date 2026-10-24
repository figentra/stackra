/**
 * Stackra file contract:
 * Purpose: proves the web ChatAttachmentGroup holds its attachments in HeroUI Pro's row and passes unknown props
 *          through.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { render, screen } from "@testing-library/react";

import { ChatAttachment } from "#react/chat-attachment/chat-attachment";
import { ChatAttachmentGroup } from "#react/chat-attachment/chat-attachment-group";

describe("ChatAttachmentGroup (web)", () => {
  it("holds the attachments and passes unknown props through", () => {
    render(
      <ChatAttachmentGroup id="g" className="extra" data-testid="group">
        <ChatAttachment name="a.png" />
        <ChatAttachment name="b.png" />
      </ChatAttachmentGroup>,
    );
    const group = screen.getByTestId("group");
    expect(group.id).toBe("g");
    expect(group.classList.contains("extra")).toBe(true);
    expect(group.dataset["slot"]).toBe("chat-attachment-group");
    expect(group.textContent).toContain("a.png");
    expect(group.textContent).toContain("b.png");
  });
});
