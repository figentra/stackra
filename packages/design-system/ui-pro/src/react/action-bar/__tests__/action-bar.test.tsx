/**
 * Stackra file contract:
 * Purpose: proves the web ActionBar names its toolbar from `label` and keeps HeroUI Pro's default name without one,
 *          shows and hides it by `isOpen`, passes unknown props through, carries HeroUI Pro's own parts, and refuses
 *          HeroUI Pro's `aria-label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so roles and names are checked,
 *          not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { ActionBar as HeroActionBar } from "@heroui-pro/react/action-bar";
import { render, screen } from "@testing-library/react";

import { ActionBar } from "#react/action-bar/action-bar";
import type { ActionBarProps } from "#react/action-bar/action-bar.props";

describe("ActionBar (web)", () => {
  it("names the toolbar from label, and keeps HeroUI Pro's default name without one", () => {
    const { rerender } = render(
      <ActionBar isOpen label="File actions">
        <ActionBar.Content>
          <button type="button">Edit</button>
        </ActionBar.Content>
      </ActionBar>,
    );
    expect(screen.getByRole("toolbar", { name: "File actions" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy();
    rerender(
      <ActionBar isOpen>
        <ActionBar.Content>x</ActionBar.Content>
      </ActionBar>,
    );
    expect(screen.getByRole("toolbar", { name: "Actions" })).toBeTruthy();
  });

  it("shows the toolbar only while isOpen and passes unknown props through", () => {
    const { unmount } = render(
      <ActionBar isOpen data-testid="bar" orientation="vertical">
        <ActionBar.Prefix>2</ActionBar.Prefix>
        <ActionBar.Suffix>clear</ActionBar.Suffix>
      </ActionBar>,
    );
    const bar = screen.getByTestId("bar");
    expect(bar.getAttribute("aria-orientation")).toBe("vertical");
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("clear")).toBeTruthy();
    unmount();
    // Closed from the start: the exit animation of a bar that was open does not finish in jsdom.
    render(
      <ActionBar isOpen={false}>
        <ActionBar.Prefix>2</ActionBar.Prefix>
      </ActionBar>,
    );
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of ["Prefix", "Content", "Suffix"] as const) {
      expect(ActionBar[part]).toBe(HeroActionBar[part]);
    }
  });

  it("takes label, and refuses HeroUI Pro's aria-label name", () => {
    expectTypeOf<ActionBarProps>().toHaveProperty("label");
    expectTypeOf<ActionBarProps>().not.toHaveProperty("aria-label");
  });
});
