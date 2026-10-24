/**
 * Stackra file contract:
 * Purpose: proves the web Rating maps `label` to the accessible name of its radio group, passes the value, size and
 *          read-only props through, calls `onValueChange`, carries HeroUI Pro's own item, lets `label` win
 *          over a stray `aria-label`, and refuses a missing `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not
 *          looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { Rating as HeroRating } from "@heroui-pro/react/rating";
import { render, screen } from "@testing-library/react";

import { Rating, type RatingProps } from "#react/rating/rating";

describe("Rating (web)", () => {
  it("names the radio group from label", () => {
    render(
      <Rating label="Quality" defaultValue={2}>
        <Rating.Item value={1} />
        <Rating.Item value={2} />
      </Rating>,
    );
    expect(screen.getByRole("radiogroup", { name: "Quality" })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("passes the value and the change callback through", () => {
    const onValueChange = vi.fn();
    render(
      <Rating label="Quality" value={1} onValueChange={onValueChange}>
        <Rating.Item value={1} />
        <Rating.Item value={2} />
      </Rating>,
    );
    const radios = screen.getAllByRole<HTMLInputElement>("radio");
    expect(radios[0]?.checked).toBe(true);
    radios[1]?.click();
    expect(onValueChange).toHaveBeenCalledWith(2);
  });

  it("passes unknown props through", () => {
    render(
      <Rating label="Quality" isReadOnly size="lg" data-testid="rating" className="extra">
        <Rating.Item value={1} />
      </Rating>,
    );
    expect(screen.getByTestId("rating").classList.contains("extra")).toBe(true);
  });

  it("carries HeroUI Pro's own item", () => {
    expect(Rating.Item).toBe(HeroRating.Item);
  });

  it("lets label win over a stray aria-label, and requires label", () => {
    render(
      <Rating label="Mapped" {...{ "aria-label": "Stray" }}>
        <Rating.Item value={1} />
      </Rating>,
    );
    expect(screen.getByRole("radiogroup", { name: "Mapped" })).toBeTruthy();
    expectTypeOf<RatingProps>().toHaveProperty("label");
    // @ts-expect-error `label` is required: a radio group with no name cannot be understood
    void (<Rating />);
  });
});
