/**
 * Stackra file contract:
 * Purpose: proves the web HoloCard draws its layers in HeroUI Pro's parts, passes unknown props and HeroUI Pro's own
 *          `isDisabled` through, and carries HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro and its motion layer; the pointer tilt needs layout, which jsdom lacks, so
 *          only the rendered structure is checked; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { HoloCard as HeroHoloCard } from "@heroui-pro/react/holo-card";
import { render, screen } from "@testing-library/react";

import { HoloCard } from "#react/holo-card/holo-card";
import type { HoloCardProps } from "#react/holo-card/holo-card.props";

describe("HoloCard (web)", () => {
  it("draws the layers in HeroUI Pro's parts and passes unknown props through", () => {
    render(
      <HoloCard data-testid="card" className="extra" gradient="red">
        <HoloCard.Rotator>
          <HoloCard.Frame>
            <HoloCard.Surface>
              <HoloCard.Image src="art.png" alt="Dragon" />
              <HoloCard.Content>Fire</HoloCard.Content>
            </HoloCard.Surface>
          </HoloCard.Frame>
        </HoloCard.Rotator>
      </HoloCard>,
    );
    const card = screen.getByTestId("card");
    expect(card.classList.contains("extra")).toBe(true);
    expect(screen.getByAltText("Dragon")).toBeTruthy();
    expect(screen.getByText("Fire")).toBeTruthy();
    expect(card.style.getPropertyValue("--holo-card-gradient")).toBe("red");
  });

  it("passes HeroUI Pro's own isDisabled through", () => {
    const { rerender } = render(
      <HoloCard data-testid="card" isDisabled>
        x
      </HoloCard>,
    );
    const disabled = screen.getByTestId("card").outerHTML;
    rerender(
      <HoloCard data-testid="card" isDisabled={false}>
        x
      </HoloCard>,
    );
    expect(screen.getByTestId("card").outerHTML).not.toBe(disabled);
    rerender(
      <HeroHoloCard.Root data-testid="card" isDisabled>
        x
      </HeroHoloCard.Root>,
    );
    expect(screen.getByTestId("card").outerHTML).toBe(disabled);
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of [
      "Rotator",
      "Frame",
      "Surface",
      "Image",
      "Inset",
      "Pattern",
      "Content",
      "Shine",
      "ShinePattern",
    ] as const) {
      expect(HoloCard[part]).toBe(HeroHoloCard[part]);
    }
  });

  it("takes children and HeroUI Pro's own props", () => {
    expectTypeOf<HoloCardProps>().toHaveProperty("children");
    expectTypeOf<HoloCardProps>().toHaveProperty("isInteractive");
  });
});
