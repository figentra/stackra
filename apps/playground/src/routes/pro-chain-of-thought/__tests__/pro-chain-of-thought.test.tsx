/**
 * Stackra file contract:
 * Purpose: proves the ChainOfThought page sits at /pro-chain-of-thought in the Pro category, titles the page and the document, and draws a collapsed trace behind a trigger button and an open streaming trace with its step.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen, fireEvent } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProChainOfThought } from "#src/routes/pro-chain-of-thought/pro-chain-of-thought";
import { ProChainOfThoughtRoute } from "#src/routes/pro-chain-of-thought/pro-chain-of-thought.route";

describe("ProChainOfThought", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-chain-of-thought in the Pro category, and titles the page and the document", () => {
    render(<ProChainOfThought />);
    expect(ProChainOfThoughtRoute.path).toBe("/pro-chain-of-thought");
    expect(ProChainOfThoughtRoute.category).toBe("AI");
    expect(
      screen.getByRole("heading", { level: 1, name: ProChainOfThoughtRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("ChainOfThought · Stackra Playground");
  });

  it("keeps the finished trace closed until its trigger is pressed", () => {
    render(<ProChainOfThought />);
    const trigger = screen.getByRole("button", { name: "Thought for 4 seconds" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("shows the streaming trace open with its step", () => {
    render(<ProChainOfThought />);
    expect(screen.getByRole("button", { name: "Thinking..." }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(screen.getByText("Analyze")).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Finished", "Still thinking"]);
  });
});
