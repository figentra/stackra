/**
 * Stackra file contract:
 * Purpose: proves the native Tooltip, an adapted form, sets its text as the accessibility hint of the element it
 *          describes without drawing anything of its own, leaves an element's own hint and every other prop alone,
 *          takes the shared props without reading them, and that the type refuses a physical side and rich content.
 * Boundary: no HeroUI Native part is involved, so nothing is stubbed; the elements are plain DOM nodes that stand for a
 *           pressable, which is all the hint needs.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 4.1.2; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-111
import { render } from "@testing-library/react";

import type { TooltipContractProps } from "#contracts/types/tooltip-contract-props.type";
import { Tooltip } from "#native/tooltip/tooltip";
import type { TooltipProps } from "#native/tooltip/tooltip.props";

/** Records each call of the stand-in pressable with the props it was handed. */
const handed = vi.fn<(props: Record<string, unknown>) => void>();

/** The props the stand-in pressable was last handed. */
const lastProps = () => handed.mock.lastCall?.[0] ?? {};

/** A stand-in for a React Native pressable: it records its props and draws one node. */
function Pressable(props: { readonly accessibilityHint?: string; readonly label?: string }) {
  handed(props);
  return <button type="button">{props.label}</button>;
}

describe("Tooltip (native)", () => {
  beforeEach(() => {
    handed.mockClear();
  });

  it("sets its text as the hint of the element and draws only that element", () => {
    const { container } = render(
      <Tooltip content="Open your account">
        <Pressable label="Account" />
      </Tooltip>,
    );
    expect(lastProps()).toMatchObject({ accessibilityHint: "Open your account" });
    expect(container.children).toHaveLength(1);
    expect(container.textContent).toBe("Account");
  });

  it("leaves the element's own hint, and its other props, as they are", () => {
    render(
      <Tooltip content="Open your account">
        <Pressable label="Account" accessibilityHint="Opens the account page" />
      </Tooltip>,
    );
    expect(lastProps()).toMatchObject({
      label: "Account",
      accessibilityHint: "Opens the account page",
    });
  });

  it("takes the open state, placement and arrow without reading them", () => {
    render(
      <Tooltip content="Open your account" isOpen placement="end" align="start" hasArrow>
        <Pressable label="Account" />
      </Tooltip>,
    );
    expect(lastProps()).toEqual({ label: "Account", accessibilityHint: "Open your account" });
  });

  it("refuses a physical side, rich content and a missing text", () => {
    expectTypeOf<TooltipProps>().toEqualTypeOf<TooltipContractProps>();
    // @ts-expect-error placement is by reading direction, so `right` is not a side
    const wrongSide: TooltipProps["placement"] = "right";
    // @ts-expect-error a tooltip is a plain-text label, never markup
    const richContent: TooltipProps["content"] = <b>x</b>;
    // @ts-expect-error a tooltip with no text says nothing
    const noText: TooltipProps = { children: <Pressable /> };
    void [wrongSide, richContent, noText];
  });
});
