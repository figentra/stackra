/**
 * Stackra file contract:
 * Purpose: proves the web ChatSource draws a link chip and a document chip from its data, puts a previewed link's
 *          `aria-haspopup` and `aria-expanded` on the link itself (no span carries them), draws custom parts, passes
 *          unknown props through, and carries HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { ChatSource as HeroChatSource } from "@heroui-pro/react/chat-source";
import { render, screen } from "@testing-library/react";

import { ChatSource } from "#react/chat-source/chat-source";

describe("ChatSource (web)", () => {
  it("draws a link chip from its data and passes unknown props through", () => {
    render(
      <ChatSource
        href="https://heroui.com"
        title="HeroUI Pro"
        id="s"
        className="extra"
        data-testid="chip"
      />,
    );
    const chip = screen.getByTestId("chip");
    expect(chip.id).toBe("s");
    expect(chip.classList.contains("extra")).toBe(true);
    const link = screen.getByRole("link", { name: /HeroUI Pro/ });
    expect(link.getAttribute("href")).toBe("https://heroui.com");
  });

  it("puts a previewed link's popup state on the link itself", () => {
    render(<ChatSource href="https://heroui.com" title="HeroUI Pro" description="Components." />);
    const link = screen.getByRole("link", { name: /HeroUI Pro/ });
    expect(link.getAttribute("aria-haspopup")).toBe("dialog");
    expect(link.getAttribute("aria-expanded")).toBe("false");
    expect(link.getAttribute("href")).toBe("https://heroui.com");
    expect(document.querySelector("span[aria-expanded]")).toBeNull();
  });

  it("draws a document chip", () => {
    render(<ChatSource sourceType="document" title="brief.pdf" data-testid="chip" />);
    expect(screen.getByTestId("chip").textContent).toContain("brief.pdf");
  });

  it("draws custom parts as its children", () => {
    render(
      <ChatSource href="https://react.dev" data-testid="chip">
        <ChatSource.Trigger>
          <ChatSource.Icon />
          <ChatSource.Title>React docs</ChatSource.Title>
        </ChatSource.Trigger>
      </ChatSource>,
    );
    expect(screen.getByRole("link", { name: /React docs/ })).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of ["Icon", "DocumentIcon", "Title", "Preview"] as const) {
      expect(ChatSource[part]).toBe(HeroChatSource[part]);
    }
  });
});
