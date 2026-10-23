/**
 * Stackra file contract:
 * Purpose: proves the ChatTool page sits at /pro-chat-tool in the Pro group, titles the page and the document, and draws a tool call in each state and a collapsed group, and announces an approval choice.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen, fireEvent } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProChatTool } from "#src/routes/pro-chat-tool/pro-chat-tool";
import { ProChatToolRoute } from "#src/routes/pro-chat-tool/pro-chat-tool.route";

describe("ProChatTool", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-chat-tool in the Pro group, and titles the page and the document", () => {
    render(<ProChatTool />);
    expect(ProChatToolRoute.path).toBe("/pro-chat-tool");
    expect(ProChatToolRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProChatToolRoute.title })).toBeTruthy();
    expect(document.title).toBe("ChatTool · Stackra Playground");
  });

  it("draws a trigger for each call", () => {
    render(<ProChatTool />);
    for (const name of ["getWeather", "searchDocs", "fetchPage", "sendEmail"])
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "2 tool calls" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["States", "Approval", "A group of calls"]);
  });

  it("announces the choice made on the approval", () => {
    render(<ProChatTool />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(screen.getByRole("status").textContent).toBe("You approved the call.");
  });
});
