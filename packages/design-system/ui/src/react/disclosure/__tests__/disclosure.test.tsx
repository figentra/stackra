/**
 * Stackra file contract:
 * Purpose: proves the web Disclosure is a button named by its title that toggles `aria-expanded` and reports the new
 *          state, starts open with `defaultExpanded`, follows a controlled `isExpanded`, and refuses when disabled.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { Disclosure } from "#react/disclosure/disclosure";

describe("Disclosure (web)", () => {
  it("toggles from its button and reports the new state", () => {
    const changes: boolean[] = [];
    render(
      <Disclosure title="Advanced options" onExpandedChange={(open) => changes.push(open)}>
        Webhook secret
      </Disclosure>,
    );
    const button = screen.getByRole("button", { name: "Advanced options" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    act(() => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(changes).toEqual([true]);
  });

  it("starts open, follows a controlled state and refuses when disabled", () => {
    const { rerender } = render(
      <Disclosure title="Details" defaultExpanded>
        Body
      </Disclosure>,
    );
    expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");
    rerender(
      <Disclosure title="Details" isExpanded={false} isDisabled>
        Body
      </Disclosure>,
    );
    const button = screen.getByRole("button");
    act(() => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });
});
