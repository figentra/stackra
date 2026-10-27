/**
 * Stackra file contract:
 * Purpose: proves the ChatAttachment page sits at /pro-chat-attachment in the Pro category, titles the page and the document, and draws a chip with a named remove button for each file, and a composer with a named attach button.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen, fireEvent } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProChatAttachment } from "#src/routes/pro-chat-attachment/pro-chat-attachment";
import { ProChatAttachmentRoute } from "#src/routes/pro-chat-attachment/pro-chat-attachment.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProChatAttachment", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-chat-attachment in the Pro category, and titles the page and the document", () => {
    render(<ProChatAttachment />);
    expect(routePath(ProChatAttachmentRoute)).toBe("/pro-chat-attachment");
    expect(ProChatAttachmentRoute.category).toBe("AI");
    expect(
      screen.getByRole("heading", { level: 1, name: ProChatAttachmentRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("ChatAttachment · Stackra Playground");
  });

  it("draws a chip for each file with a remove button named for it", () => {
    render(<ProChatAttachment />);
    expect(screen.getByText("project-brief.pdf")).toBeTruthy();
    expect(
      screen
        .getAllByRole("button", { name: /^Remove / })
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual([
      "Remove project-brief.pdf",
      "Remove design-assets.zip",
      "Remove quarterly-report.xlsx",
      "Remove index.tsx",
    ]);
  });

  it("removes a chip when its button is pressed", () => {
    render(<ProChatAttachment />);
    fireEvent.click(screen.getByRole("button", { name: "Remove index.tsx" }));
    expect(screen.queryByText("index.tsx")).toBeNull();
  });

  it("draws a composer with a named attach button and send button", () => {
    render(<ProChatAttachment />);
    expect(screen.getByRole("button", { name: "Attach file" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send message" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Message about your files" })).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Attached files", "Composer"]);
  });
});
