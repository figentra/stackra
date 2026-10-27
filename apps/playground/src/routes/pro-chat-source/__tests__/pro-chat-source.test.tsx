/**
 * Stackra file contract:
 * Purpose: proves the ChatSource page sits at /pro-chat-source in the Pro category, titles the page and the document, and draws a web source as a link, a document source, and a collapsed list of sources behind a trigger.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProChatSource } from "#src/routes/pro-chat-source/pro-chat-source";
import { ProChatSourceRoute } from "#src/routes/pro-chat-source/pro-chat-source.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProChatSource", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-chat-source in the Pro category, and titles the page and the document", () => {
    render(<ProChatSource />);
    expect(routePath(ProChatSourceRoute)).toBe("/pro-chat-source");
    expect(ProChatSourceRoute.category).toBe("AI");
    expect(screen.getByRole("heading", { level: 1, name: ProChatSourceRoute.title })).toBeTruthy();
    expect(document.title).toBe("ChatSource · Stackra Playground");
  });

  it("draws the web source as a link and the document source by its title", () => {
    render(<ProChatSource />);
    expect(screen.getByRole("link", { name: /HeroUI Pro/ }).getAttribute("href")).toBe(
      "https://heroui.com",
    );
    expect(screen.getByText("Q3-launch-brief.pdf")).toBeTruthy();
  });

  it("keeps the list of sources behind a trigger that counts them", () => {
    render(<ProChatSource />);
    expect(screen.getByRole("button", { name: "3 sources" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["One source", "A document", "Several sources"]);
  });
});
