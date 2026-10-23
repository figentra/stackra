/**
 * Stackra file contract:
 * Purpose: proves the web PromptInput passes `size`, `isDisabled` and `isLoading` (as HeroUI Pro's `isPending`) to
 *          the composer, names the text area, send button and actions from `label`, submits the typed value once,
 *          stops a running reply, passes unknown props through, carries HeroUI Pro's own parts, and refuses
 *          `isPending` and a missing action `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { PromptInput as HeroPromptInput } from "@heroui-pro/react/prompt-input";
import { fireEvent, render, screen } from "@testing-library/react";

import { PromptInput } from "#react/prompt-input/prompt-input";

describe("PromptInput (web)", () => {
  it("draws the composer, names the parts from label and passes unknown props through", () => {
    render(
      <PromptInput id="p" className="extra" data-testid="composer">
        <PromptInput.Shell>
          <PromptInput.Content>
            <PromptInput.TextArea label="Ask the assistant" />
          </PromptInput.Content>
          <PromptInput.Toolbar>
            <PromptInput.ToolbarStart>
              <PromptInput.Action label="Attach file" tooltip="Attach file">
                <svg />
              </PromptInput.Action>
            </PromptInput.ToolbarStart>
            <PromptInput.ToolbarEnd>
              <PromptInput.Send label="Send it" />
            </PromptInput.ToolbarEnd>
          </PromptInput.Toolbar>
        </PromptInput.Shell>
        <PromptInput.Footer>Check important info.</PromptInput.Footer>
      </PromptInput>,
    );
    const composer = screen.getByTestId("composer");
    expect(composer.id).toBe("p");
    expect(composer.classList.contains("extra")).toBe(true);
    expect(screen.getByRole("textbox", { name: "Ask the assistant" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Attach file" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send it" })).toBeTruthy();
    expect(screen.getByText("Check important info.")).toBeTruthy();
  });

  it("keeps HeroUI Pro's own names on the text area and the send button when no label is given", () => {
    render(
      <PromptInput>
        <PromptInput.TextArea />
        <PromptInput.Send />
      </PromptInput>,
    );
    expect(screen.getByRole("textbox", { name: "Message input" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send message" })).toBeTruthy();
  });

  it("submits the typed value once with the send button", () => {
    const onSubmit = vi.fn();
    const onValueChange = vi.fn();
    render(
      <PromptInput value="hello" onSubmit={onSubmit} onValueChange={onValueChange}>
        <PromptInput.TextArea />
        <PromptInput.Send />
      </PromptInput>,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello!" } });
    expect(onValueChange).toHaveBeenCalledWith("hello!");
    screen.getByRole("button", { name: "Send message" }).click();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("maps isDisabled to HeroUI Pro's, which disables the text area and the send button", () => {
    render(
      <PromptInput isDisabled value="hello">
        <PromptInput.TextArea />
        <PromptInput.Send />
      </PromptInput>,
    );
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).disabled).toBe(true);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("maps isLoading to HeroUI Pro's isPending, which swaps send for stop and stops once", () => {
    const onStop = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <PromptInput isLoading onStop={onStop} onSubmit={onSubmit} value="x">
        <PromptInput.Send />
      </PromptInput>,
    );
    const stop = screen.getByRole("button", { name: "Stop" });
    expect(stop.dataset["status"]).toBe("streaming");
    stop.click();
    expect(onStop).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
    rerender(
      <PromptInput onStop={onStop} onSubmit={onSubmit} value="x">
        <PromptInput.Send />
      </PromptInput>,
    );
    expect(screen.getByRole("button", { name: "Send message" }).dataset["status"]).toBe("ready");
  });

  it("passes the size to HeroUI Pro, and leaves its default without one", () => {
    const { rerender } = render(
      <PromptInput size="lg" data-testid="composer">
        <PromptInput.Shell>x</PromptInput.Shell>
      </PromptInput>,
    );
    const large = screen.getByTestId("composer").className;
    rerender(
      <PromptInput data-testid="composer">
        <PromptInput.Shell>x</PromptInput.Shell>
      </PromptInput>,
    );
    expect(screen.getByTestId("composer").className).not.toBe(large);
    rerender(
      <HeroPromptInput.Root size="lg" data-testid="composer">
        <HeroPromptInput.Shell>x</HeroPromptInput.Shell>
      </HeroPromptInput.Root>,
    );
    expect(screen.getByTestId("composer").className).toBe(large);
  });

  it("maps isLoading on the send button to HeroUI Pro's isPending", () => {
    render(
      <PromptInput value="x">
        <PromptInput.Send isLoading />
      </PromptInput>,
    );
    expect(screen.getByRole("button", { name: "Send message" }).dataset["pending"]).toBe("true");
  });

  it("carries HeroUI Pro's own parts and refuses the renamed props", () => {
    for (const part of [
      "Shell",
      "Content",
      "Attachments",
      "Toolbar",
      "ToolbarStart",
      "ToolbarEnd",
      "Footer",
      "Queue",
      "Token",
      "TokenInput",
      "TokenSuggestions",
      "Tokens",
    ] as const) {
      expect(PromptInput[part]).toBe(HeroPromptInput[part]);
    }
    // @ts-expect-error `isLoading` is the one name for the loading state
    void (<PromptInput isPending>x</PromptInput>);
    // @ts-expect-error `label` is required: HeroUI Pro gives this part no accessible name of its own
    void (<PromptInput.Action>x</PromptInput.Action>);
  });
});
