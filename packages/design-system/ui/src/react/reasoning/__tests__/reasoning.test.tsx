/**
 * Stackra file contract:
 * Purpose: proves the web Reasoning is a disclosure named by its summary that opens to a named list of steps, and
 *          shimmers "Thinking…" while it streams.
 * Boundary: jsdom with the real HeroUI Disclosure.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Reasoning } from "#react/reasoning/reasoning";

const STEPS = [
  { key: "search", label: "Searched the menu", content: "Found 12 dishes." },
  { key: "pick", content: "Picked the three cheapest." },
];

describe("Reasoning (web)", () => {
  it("opens to the named list of steps", () => {
    render(<Reasoning steps={STEPS} summary="Thought for 4s" />);
    const trigger = screen.getByRole("button", { name: "Thought for 4s" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const list = screen.getByRole("list", { name: "Reasoning steps" });
    expect(list.querySelectorAll("li")).toHaveLength(2);
    expect(screen.getByText("Searched the menu")).toBeTruthy();
  });

  it("shimmers while streaming", () => {
    render(<Reasoning steps={STEPS} isStreaming />);
    expect(screen.getByRole("status").textContent).toBe("Thinking…");
  });
});
