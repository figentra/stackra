/**
 * Stackra file contract:
 * Purpose: proves the web Tooltip shows on keyboard focus and not before, describes its element without renaming it,
 *          hides on Escape, draws the arrow only when asked, runs controlled and uncontrolled and reports each change,
 *          passes HeroUI's root props through, and that the type refuses a physical side and rich content.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded and nothing is laid out, so where the
 *           tooltip lands and how long a hover takes are checked by the playground's e2e suite.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 1.4.13, 4.1.2; ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-111
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { TooltipContractProps } from "#contracts/types/tooltip-contract-props.type";
import { IconButton } from "#react/icon-button/icon-button";
import { Tooltip, type TooltipProps } from "#react/tooltip/tooltip";

/** Puts the page in keyboard modality, then focuses the element: React Aria shows a tooltip on keyboard focus only. */
function focusByKeyboard(element: HTMLElement) {
  fireEvent.keyDown(document.body, { key: "Tab" });
  act(() => element.focus());
}

const target = <IconButton icon="user-round" label="Account" />;

describe("Tooltip (web)", () => {
  it("shows its text on keyboard focus and not before", () => {
    render(<Tooltip content="Open your account">{target}</Tooltip>);
    expect(screen.queryByRole("tooltip")).toBeNull();
    focusByKeyboard(screen.getByRole("button", { name: "Account" }));
    expect(screen.getByRole("tooltip").textContent).toBe("Open your account");
  });

  it("describes the element and leaves its name alone", () => {
    render(<Tooltip content="Open your account">{target}</Tooltip>);
    const button = screen.getByRole("button", { name: "Account" });
    focusByKeyboard(button);
    expect(button.getAttribute("aria-describedby")).toBe(screen.getByRole("tooltip").id);
    expect(screen.getByRole("button", { name: "Account" })).toBe(button);
  });

  it("hides on Escape", () => {
    render(<Tooltip content="Open your account">{target}</Tooltip>);
    focusByKeyboard(screen.getByRole("button", { name: "Account" }));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("draws the arrow only when asked", () => {
    const { rerender } = render(
      <Tooltip content="Open your account" defaultOpen>
        {target}
      </Tooltip>,
    );
    expect(document.querySelector('[data-slot="overlay-arrow"]')).toBeNull();
    rerender(
      <Tooltip content="Open your account" defaultOpen hasArrow>
        {target}
      </Tooltip>,
    );
    expect(document.querySelector('[data-slot="overlay-arrow"]')).toBeTruthy();
  });

  it("starts open with defaultOpen and reports a change", () => {
    const onOpenChange = vi.fn();
    render(
      <Tooltip content="Open your account" defaultOpen onOpenChange={onOpenChange}>
        {target}
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("follows isOpen when controlled", () => {
    const { rerender } = render(
      <Tooltip content="Open your account" isOpen={false}>
        {target}
      </Tooltip>,
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
    rerender(
      <Tooltip content="Open your account" isOpen>
        {target}
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip")).toBeTruthy();
  });

  it("never shows while disabled, a HeroUI root prop passed through", () => {
    render(
      <Tooltip content="Open your account" isDisabled>
        {target}
      </Tooltip>,
    );
    focusByKeyboard(screen.getByRole("button", { name: "Account" }));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("refuses a physical side, rich content and a missing text", () => {
    expectTypeOf<TooltipProps>().toExtend<TooltipContractProps>();
    // @ts-expect-error placement is by reading direction, so `right` is not a side
    const wrongSide: TooltipProps["placement"] = "right";
    // @ts-expect-error a tooltip is a plain-text label, never markup
    const richContent: TooltipProps["content"] = <b>x</b>;
    // @ts-expect-error a tooltip with no text says nothing
    const noText: TooltipProps = { children: target };
    void [wrongSide, richContent, noText];
  });
});
