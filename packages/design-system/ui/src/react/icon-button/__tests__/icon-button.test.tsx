/**
 * Stackra file contract:
 * Purpose: proves the web IconButton is HeroUI's icon-only button named by `label`, swaps its icon for the hidden
 *          spinner while loading without losing its name, forwards its variant, size and press, and that the type
 *          refuses a missing label.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); WCAG 2.2 SC 4.1.2; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-022 sta-350:FR-024 sta-350:P-016 sta-350:FR-053
import { act, render, screen } from "@testing-library/react";

import type { IconButtonContractProps } from "#contracts/types/icon-button-contract-props.type";
import { IconButton, type IconButtonProps } from "#react/icon-button/icon-button";

const icon = <i data-testid="icon" />;

describe("IconButton (web)", () => {
  it("is HeroUI's icon-only button with the icon inside and the name from label", () => {
    render(<IconButton icon={icon} label="Settings" />);
    const button = screen.getByRole("button", { name: "Settings" });
    expect(button.classList.contains("button--icon-only")).toBe(true);
    expect(button.querySelector('[data-testid="icon"]')).toBeTruthy();
  });

  it("swaps the icon for the hidden spinner while loading and keeps its name", () => {
    render(<IconButton icon={icon} label="Settings" isLoading />);
    const button = screen.getByRole("button", { name: "Settings" });
    expect(screen.queryByTestId("icon")).toBeNull();
    expect(button.querySelector('[data-slot="spinner"]')?.getAttribute("aria-hidden")).toBe("true");
  });

  it("forwards the variant, the size and the press", () => {
    const onPress = vi.fn();
    render(<IconButton icon={icon} label="Delete" variant="danger" size="lg" onPress={onPress} />);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.classList.contains("button--danger")).toBe(true);
    expect(button.classList.contains("button--lg")).toBe(true);
    act(() => button.click());
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("requires a label and has no text or full-width props", () => {
    expectTypeOf<IconButtonProps>().toExtend<IconButtonContractProps>();
    // @ts-expect-error nothing else names an icon-only button
    void (<IconButton icon={icon} />);
    void (
      (
        // @ts-expect-error an icon button has no text children
        <IconButton icon={icon} label="x">
          text
        </IconButton>
      )
    );
  });

  it("draws an icon name through Icon and an element as given", () => {
    const { container } = render(<IconButton icon="user-round" label="Profile" />);
    expect(container.querySelector("svg.lucide-user-round")).toBeTruthy();
  });
});
