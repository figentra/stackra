/**
 * Stackra file contract:
 * Purpose: proves the web HoverCard maps `isOpen` to HeroUI Pro's `open`, names its card from `label`, puts the
 *          trigger's `aria-haspopup` and `aria-expanded` on the link itself (no wrapping span), passes unknown props
 *          through, carries HeroUI Pro's Arrow, and refuses HeroUI Pro's `open` and `aria-label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so roles and names are checked,
 *          not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-004
import { HoverCard as HeroHoverCard } from "@heroui-pro/react/hover-card";
import { Link } from "@heroui/react";
import { render, screen } from "@testing-library/react";

import { HoverCard } from "#react/hover-card/hover-card";
import type { HoverCardContentProps } from "#react/hover-card/hover-card-content.props";
import type { HoverCardProps } from "#react/hover-card/hover-card.props";

/** A hover card with a labelled card, the open state left to the caller. */
function Example(props: Partial<HoverCardProps>) {
  return (
    <HoverCard {...props}>
      <HoverCard.Trigger>
        <Link href="#profile" data-testid="trigger">
          @stackra
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Content label="Profile" data-testid="card">
        Stackra design system
      </HoverCard.Content>
    </HoverCard>
  );
}

describe("HoverCard (web)", () => {
  it("names the card from label and draws its content", () => {
    render(<Example defaultOpen />);
    const card = screen.getByRole("dialog", { name: "Profile" });
    expect(card.textContent).toContain("Stackra design system");
  });

  it("leaves the card unnamed when label is left out", () => {
    render(
      <HoverCard defaultOpen>
        <HoverCard.Trigger>
          <Link href="#profile">@stackra</Link>
        </HoverCard.Trigger>
        <HoverCard.Content>Body</HoverCard.Content>
      </HoverCard>,
    );
    expect(screen.getByRole("dialog").hasAttribute("aria-label")).toBe(false);
  });

  it("maps isOpen to HeroUI Pro's open, in both directions", () => {
    const { rerender } = render(<Example isOpen />);
    expect(screen.queryByRole("dialog")).not.toBeNull();
    rerender(<Example isOpen={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("puts the card's popup state on the link itself, with no span around it", () => {
    const { rerender } = render(<Example isOpen={false} />);
    const link = screen.getByRole("link", { name: "@stackra" });
    expect(link.getAttribute("aria-haspopup")).toBe("dialog");
    expect(link.getAttribute("aria-expanded")).toBe("false");
    expect(link.parentElement?.hasAttribute("aria-expanded")).toBe(false);
    rerender(<Example isOpen />);
    expect(link.getAttribute("aria-expanded")).toBe("true");
  });

  it("passes unknown props through to the trigger and the card", () => {
    render(<Example defaultOpen />);
    expect(screen.getByTestId("trigger").textContent).toBe("@stackra");
    expect(screen.getByTestId("card").textContent).toContain("Stackra design system");
  });

  it("carries HeroUI Pro's own Arrow", () => {
    expect(HoverCard.Arrow).toBe(HeroHoverCard.Arrow);
  });

  it("refuses HeroUI Pro's names for the open state and the accessible name", () => {
    expectTypeOf<HoverCardProps>().toHaveProperty("isOpen");
    // @ts-expect-error `isOpen` is the one name for the controlled open state
    void (<HoverCard open>x</HoverCard>);
    // `aria-label` is a hyphenated attribute, which JSX does not type-check: the type itself is asserted.
    expectTypeOf<HoverCardContentProps>().not.toHaveProperty("aria-label");
  });
});
