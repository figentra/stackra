/**
 * Stackra file contract:
 * Purpose: proves the web ChainOfThought draws HeroUI Pro's timeline (trigger, steps, expansion), passes
 *          `isStreaming` and unknown props through, and carries HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { ChainOfThought as HeroChainOfThought } from "@heroui-pro/react/chain-of-thought";
import { render, screen } from "@testing-library/react";

import { ChainOfThought } from "#react/chain-of-thought/chain-of-thought";

describe("ChainOfThought (web)", () => {
  it("draws the trigger and the steps of an expanded timeline and passes unknown props through", () => {
    render(
      <ChainOfThought isExpanded data-testid="root" className="extra">
        <ChainOfThought.Trigger>Thought for 4 seconds</ChainOfThought.Trigger>
        <ChainOfThought.Content>
          <ChainOfThought.Steps>
            <ChainOfThought.Step label="Search">Looked it up</ChainOfThought.Step>
          </ChainOfThought.Steps>
        </ChainOfThought.Content>
      </ChainOfThought>,
    );
    const root = screen.getByTestId("root");
    expect(root.classList.contains("extra")).toBe(true);
    expect(screen.getByRole("button", { name: "Thought for 4 seconds" })).toBeTruthy();
    expect(screen.getByText("Search")).toBeTruthy();
    expect(screen.getByText("Looked it up")).toBeTruthy();
  });

  it("passes isStreaming to HeroUI Pro, which marks the root", () => {
    const { rerender } = render(
      <ChainOfThought isStreaming data-testid="root">
        <ChainOfThought.Trigger>Thinking</ChainOfThought.Trigger>
      </ChainOfThought>,
    );
    expect(screen.getByTestId("root").classList.contains("chain-of-thought--streaming")).toBe(true);
    rerender(
      <ChainOfThought data-testid="root">
        <ChainOfThought.Trigger>Thinking</ChainOfThought.Trigger>
      </ChainOfThought>,
    );
    expect(screen.getByTestId("root").classList.contains("chain-of-thought--streaming")).toBe(
      false,
    );
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of ["Trigger", "Content", "Steps", "Step"] as const) {
      expect(ChainOfThought[part]).toBe(HeroChainOfThought[part]);
    }
  });
});
