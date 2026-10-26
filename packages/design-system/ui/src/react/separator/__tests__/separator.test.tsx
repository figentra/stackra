/**
 * Stackra file contract:
 * Purpose: proves the web Separator is a horizontal `hr` by default and a vertical `role="separator"` with its
 *          orientation, draws every colour level as HeroUI's class, passes names, ids and the ref through, can be made
 *          decorative through `render`, and keeps its value names equal to HeroUI's.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-029 sta-350:FR-030 sta-350:P-019 sta-350:P-022
import type { SeparatorVariants } from "@heroui/react";
import { render, screen } from "@testing-library/react";
import { createElement, createRef } from "react";

import { Orientation } from "#contracts/enums/orientation.enum";
import { SeparatorVariant } from "#contracts/enums/separator-variant.enum";
import type { SeparatorContractProps } from "#contracts/types/separator-contract-props.type";
import { Separator } from "#react/separator/separator";
import type { SeparatorProps } from "#react/separator/separator.props";

describe("Separator (web)", () => {
  it("is a horizontal rule by default", () => {
    render(<Separator />);
    const rule = screen.getByRole("separator");
    expect(rule.tagName).toBe("HR");
    expect(rule.classList.contains("separator--horizontal")).toBe(true);
    expect(rule.classList.contains("separator--default")).toBe(true);
    expect(rule.getAttribute("data-orientation")).toBe("horizontal");
    expect(rule.hasAttribute("aria-orientation")).toBe(false);
  });

  it("is a vertical separator with its orientation when asked", () => {
    render(<Separator orientation="vertical" />);
    const rule = screen.getByRole("separator");
    expect(rule.tagName).toBe("DIV");
    expect(rule.getAttribute("aria-orientation")).toBe("vertical");
    expect(rule.classList.contains("separator--vertical")).toBe(true);
  });

  it.each(SeparatorVariant)("draws the %s level as HeroUI's class", (variant) => {
    render(<Separator variant={variant} />);
    expect(screen.getByRole("separator").classList.contains(`separator--${variant}`)).toBe(true);
  });

  it("passes the name, id, class, data props and the ref through", () => {
    const ref = createRef<HTMLHRElement>();
    render(
      <Separator ref={ref} aria-label="Sections" id="r" className="mine" data-testid="rule" />,
    );
    const rule = screen.getByRole("separator", { name: "Sections" });
    expect(rule.id).toBe("r");
    expect(rule.classList.contains("mine")).toBe(true);
    expect(rule.getAttribute("data-testid")).toBe("rule");
    expect(ref.current).toBe(rule);
  });

  it("is decorative through `render` with `aria-hidden`, the one documented way", () => {
    // `render` is typed for one element's ref; a plain object type lets an `hr` take the props.
    render(
      <Separator
        render={(props: object) => createElement("hr", { ...props, "aria-hidden": "true" })}
      />,
    );
    expect(screen.queryAllByRole("separator")).toHaveLength(0);
  });

  it("types: extends the contract and takes exactly HeroUI's values", () => {
    expectTypeOf<SeparatorProps>().toExtend<SeparatorContractProps>();
    expectTypeOf<Orientation>().toEqualTypeOf<NonNullable<SeparatorVariants["orientation"]>>();
    expectTypeOf<SeparatorVariant>().toEqualTypeOf<NonNullable<SeparatorVariants["variant"]>>();
    // @ts-expect-error `thin` is HeroUI Native's thickness, not a colour level
    render(<Separator variant="thin" />);
  });

  it("lists both orientations", () => {
    expect([...Orientation]).toEqual(["horizontal", "vertical"]);
  });
});
