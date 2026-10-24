/**
 * Stackra file contract:
 * Purpose: proves the web ChatTool draws a preset row from `state` and `toolName`, maps `isActive` to HeroUI Pro's
 *          `active`, composes HeroUI Pro's parts, passes unknown props through, calls the approval handlers once,
 *          and refuses HeroUI Pro's `active` name.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { ChatTool as HeroChatTool } from "@heroui-pro/react/chat-tool";
import { cleanup, render, screen } from "@testing-library/react";

import { ChatTool } from "#react/chat-tool/chat-tool";

describe("ChatTool (web)", () => {
  it("draws a preset row from its state and tool name, and passes unknown props through", () => {
    render(
      <ChatTool
        state="output-available"
        toolName="getWeather"
        isExpanded
        argsText='{"city":"Paris"}'
        output={{ summary: "18C" }}
        className="extra"
        data-testid="tool"
      />,
    );
    const tool = screen.getByTestId("tool");
    expect(tool.classList.contains("extra")).toBe(true);
    expect(screen.getByRole("button", { name: /getWeather/ })).toBeTruthy();
    expect(tool.textContent).toContain("Paris");
    expect(tool.textContent).toContain("18C");
  });

  it("maps isActive to HeroUI Pro's active, which marks the root and shimmers the trigger", () => {
    const { rerender } = render(
      <ChatTool state="output-available" toolName="t" isActive data-testid="tool" />,
    );
    expect(screen.getByTestId("tool").dataset["active"]).toBe("true");
    expect(screen.getByTestId("tool").querySelector("[data-slot='text-shimmer']")).toBeTruthy();
    rerender(
      <ChatTool state="output-available" toolName="t" isActive={false} data-testid="tool" />,
    );
    expect(screen.getByTestId("tool").dataset["active"]).toBeUndefined();
  });

  it("leaves HeroUI Pro's default when isActive is left out", () => {
    render(<ChatTool state="input-streaming" toolName="t" data-testid="tool" />);
    const running = screen.getByTestId("tool").dataset["active"];
    cleanup();
    render(<HeroChatTool.Root state="input-streaming" toolName="t" data-testid="tool" />);
    expect(screen.getByTestId("tool").dataset["active"]).toBe(running);
  });

  it("composes HeroUI Pro's parts", () => {
    render(
      <ChatTool state="output-available" isExpanded>
        <ChatTool.Trigger>
          <ChatTool.StatusIcon />
          Used tool
        </ChatTool.Trigger>
        <ChatTool.Content>
          <ChatTool.Args input={{ city: "Paris" }} label="Parameters" />
          <ChatTool.Result value={{ summary: "18C" }} label="Result" />
        </ChatTool.Content>
      </ChatTool>,
    );
    expect(screen.getByText("Parameters")).toBeTruthy();
    expect(screen.getByText("Result")).toBeTruthy();
  });

  it("calls the approval handlers once each", () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(
      <ChatTool
        state="requires-action"
        toolName="sendEmail"
        isExpanded
        approveLabel="Approve"
        rejectLabel="Reject"
        onApprove={onApprove}
        onReject={onReject}
      />,
    );
    screen.getByRole("button", { name: "Approve" }).click();
    expect(onApprove).toHaveBeenCalledOnce();
    expect(onReject).not.toHaveBeenCalled();
    screen.getByRole("button", { name: "Reject" }).click();
    expect(onReject).toHaveBeenCalledOnce();
  });

  it("carries HeroUI Pro's own parts and refuses its active name", () => {
    for (const part of [
      "Trigger",
      "StatusIcon",
      "Content",
      "Args",
      "Result",
      "Error",
      "Approval",
      "ApprovalActions",
      "Approve",
      "Reject",
      "Meta",
    ] as const) {
      expect(ChatTool[part]).toBe(HeroChatTool[part]);
    }
    // @ts-expect-error `isActive` is the one name for a running tool
    void (<ChatTool state="input-streaming" active />);
  });
});
