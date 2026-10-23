/**
 * Stackra file contract:
 * Purpose: proves the web CloseButton is named by `label` and never by HeroUI's English "Close", draws HeroUI's mark
 *          unless an icon replaces it, presses once and not when disabled, and that the type refuses a missing label.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); WCAG 2.2 SC 4.1.2; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-022 sta-350:FR-024 sta-350:P-016
import { act, render, screen } from "@testing-library/react";

import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";
import { CloseButton, type CloseButtonProps } from "#react/close-button/close-button";

describe("CloseButton (web)", () => {
  it("is named by label, never by HeroUI's default", () => {
    render(<CloseButton label="إغلاق" />);
    expect(screen.getByRole("button", { name: "إغلاق" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("draws HeroUI's mark without an icon and the given icon in its place", () => {
    const { container, rerender } = render(<CloseButton label="Close" />);
    expect(container.querySelector('[data-slot="close-button-icon"]')).toBeTruthy();
    rerender(<CloseButton label="Close" icon={<i data-testid="mine" />} />);
    expect(container.querySelector('[data-slot="close-button-icon"]')).toBeNull();
    expect(screen.getByTestId("mine")).toBeTruthy();
  });

  it("calls onPress once and not when disabled", () => {
    const onPress = vi.fn();
    const { rerender } = render(<CloseButton label="Close" onPress={onPress} />);
    act(() => screen.getByRole("button").click());
    expect(onPress).toHaveBeenCalledOnce();
    rerender(<CloseButton label="Close" onPress={onPress} isDisabled />);
    act(() => screen.getByRole("button").click());
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("requires a label", () => {
    expectTypeOf<CloseButtonProps>().toExtend<CloseButtonContractProps>();
    // @ts-expect-error HeroUI's default name is English, so the type asks for one
    void (<CloseButton />);
  });
});
