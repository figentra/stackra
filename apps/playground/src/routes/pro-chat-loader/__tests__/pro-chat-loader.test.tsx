/**
 * Stackra file contract:
 * Purpose: proves the ChatLoader page sits at /pro-chat-loader in the Pro category, titles the page and the document, and draws three named status indicators and a skeleton.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProChatLoader } from "#src/routes/pro-chat-loader/pro-chat-loader";
import { ProChatLoaderRoute } from "#src/routes/pro-chat-loader/pro-chat-loader.route";

describe("ProChatLoader", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-chat-loader in the Pro category, and titles the page and the document", () => {
    render(<ProChatLoader />);
    expect(ProChatLoaderRoute.path).toBe("/pro-chat-loader");
    expect(ProChatLoaderRoute.category).toBe("AI");
    expect(screen.getByRole("heading", { level: 1, name: ProChatLoaderRoute.title })).toBeTruthy();
    expect(document.title).toBe("ChatLoader · Stackra Playground");
  });

  it("names each indicator as a status", () => {
    render(<ProChatLoader />);
    expect(
      screen.getAllByRole("status").map((status) => status.getAttribute("aria-label")),
    ).toEqual([
      "The assistant is typing",
      "The assistant is thinking",
      "The assistant is loading",
      "Loading",
    ]);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Indicators", "Skeleton"]);
  });
});
