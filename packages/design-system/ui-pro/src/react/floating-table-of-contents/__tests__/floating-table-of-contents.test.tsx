/**
 * Stackra file contract:
 * Purpose: proves the web FloatingTableOfContents maps `isOpen` to HeroUI Pro's `open`, names its trigger from
 *          `label`, maps `isActive` to HeroUI Pro's `active` on bars and items, passes unknown props through,
 *          carries HeroUI Pro's own Content, and refuses HeroUI Pro's `open`, `active` and `aria-label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so attributes and names are
 *          checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0231 (no abbreviations); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-004
import { FloatingToc as HeroFloatingToc } from "@heroui-pro/react/floating-toc";
import { render, screen } from "@testing-library/react";

import {
  FloatingTableOfContents,
  type FloatingTableOfContentsProps,
  type FloatingTableOfContentsTriggerProps,
} from "#react/floating-table-of-contents/floating-table-of-contents";

/** A table of contents with two sections, the open state left to the caller. */
function Example(props: Partial<FloatingTableOfContentsProps>) {
  return (
    <FloatingTableOfContents {...props}>
      <FloatingTableOfContents.Trigger label="On this page" data-testid="trigger">
        <FloatingTableOfContents.Bar isActive data-testid="active-bar" />
        <FloatingTableOfContents.Bar data-testid="idle-bar" />
      </FloatingTableOfContents.Trigger>
      <FloatingTableOfContents.Content>
        <FloatingTableOfContents.Item isActive data-testid="active-item">
          Intro
        </FloatingTableOfContents.Item>
        <FloatingTableOfContents.Item data-testid="idle-item">Usage</FloatingTableOfContents.Item>
      </FloatingTableOfContents.Content>
    </FloatingTableOfContents>
  );
}

describe("FloatingTableOfContents (web)", () => {
  it("names the trigger from label", () => {
    render(<Example />);
    expect(screen.getByTestId("trigger").getAttribute("aria-label")).toBe("On this page");
  });

  it("maps isOpen to HeroUI Pro's open, in both directions", () => {
    const { rerender } = render(<Example isOpen />);
    expect(screen.queryByText("Intro")).not.toBeNull();
    rerender(<Example isOpen={false} />);
    expect(screen.queryByText("Intro")).toBeNull();
  });

  it("maps isActive to HeroUI Pro's active on the bar, and leaves it idle without", () => {
    const { rerender } = render(<FloatingTableOfContents.Bar isActive data-testid="bar" />);
    const active = screen.getByTestId("bar").outerHTML;
    rerender(<FloatingTableOfContents.Bar data-testid="bar" />);
    const idle = screen.getByTestId("bar").outerHTML;
    expect(active).not.toBe(idle);
    rerender(<HeroFloatingToc.Bar active data-testid="bar" />);
    expect(screen.getByTestId("bar").outerHTML).toBe(active);
    rerender(<HeroFloatingToc.Bar data-testid="bar" />);
    expect(screen.getByTestId("bar").outerHTML).toBe(idle);
  });

  it("maps isActive to HeroUI Pro's active on the item, and leaves it idle without", () => {
    const { rerender } = render(
      <FloatingTableOfContents.Item isActive data-testid="item">
        Intro
      </FloatingTableOfContents.Item>,
    );
    const active = screen.getByTestId("item").outerHTML;
    rerender(<FloatingTableOfContents.Item data-testid="item">Intro</FloatingTableOfContents.Item>);
    const idle = screen.getByTestId("item").outerHTML;
    expect(active).not.toBe(idle);
    rerender(
      <HeroFloatingToc.Item active data-testid="item">
        Intro
      </HeroFloatingToc.Item>,
    );
    expect(screen.getByTestId("item").outerHTML).toBe(active);
  });

  it("carries HeroUI Pro's own Content", () => {
    expect(FloatingTableOfContents.Content).toBe(HeroFloatingToc.Content);
  });

  it("refuses HeroUI Pro's names and requires the trigger's name", () => {
    expectTypeOf<FloatingTableOfContentsProps>().toHaveProperty("isOpen");
    // @ts-expect-error `isOpen` is the one name for the controlled open state
    void (<FloatingTableOfContents open>x</FloatingTableOfContents>);
    // @ts-expect-error `isActive` is the one name for the active state
    void (<FloatingTableOfContents.Bar active />);
    // @ts-expect-error `isActive` is the one name for the active state
    void (<FloatingTableOfContents.Item active>x</FloatingTableOfContents.Item>);
    // @ts-expect-error `label` is required: the trigger holds bars and no text
    void (<FloatingTableOfContents.Trigger>x</FloatingTableOfContents.Trigger>);
    // `aria-label` is a hyphenated attribute, which JSX does not type-check: the type itself is asserted.
    expectTypeOf<FloatingTableOfContentsTriggerProps>().not.toHaveProperty("aria-label");
  });
});
