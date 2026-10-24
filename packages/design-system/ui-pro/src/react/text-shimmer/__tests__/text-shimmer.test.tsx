/**
 * Stackra file contract:
 * Purpose: proves the web TextShimmer draws its text twice (the text and the highlight, which is hidden from
 *          assistive technology), passes unknown props and HeroUI Pro's `render` through.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { render, screen } from "@testing-library/react";

import { TextShimmer } from "#react/text-shimmer/text-shimmer";

describe("TextShimmer (web)", () => {
  it("draws the text and a hidden highlight copy, and passes unknown props through", () => {
    render(
      <TextShimmer id="s" className="extra" data-testid="shimmer">
        Thinking
      </TextShimmer>,
    );
    const shimmer = screen.getByTestId("shimmer");
    expect(shimmer.tagName).toBe("SPAN");
    expect(shimmer.id).toBe("s");
    expect(shimmer.classList.contains("extra")).toBe(true);
    expect(shimmer.querySelector("[data-slot='text-shimmer-text']")?.textContent).toBe("Thinking");
    const highlight = shimmer.querySelector("[data-slot='text-shimmer-highlight']");
    expect(highlight?.textContent).toBe("Thinking");
    expect(highlight?.getAttribute("aria-hidden")).toBe("true");
  });

  it("draws another element through HeroUI Pro's render prop", () => {
    render(
      <TextShimmer data-testid="shimmer" render={(props) => <strong {...(props as object)} />}>
        Working
      </TextShimmer>,
    );
    expect(screen.getByTestId("shimmer").tagName).toBe("STRONG");
  });
});
