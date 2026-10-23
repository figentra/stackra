/**
 * Stackra file contract:
 * Purpose: proves the button page titles the document, shows one button per variant in every size and each state, loads its save sample for a moment, and counts presses on the live button and not on the disabled one.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-027 sta-350:P-018
import { ButtonVariant, Size } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { Button } from "#src/routes/button/button";
import { ButtonRoute } from "#src/routes/button/button.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Button />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Button page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /button under Actions", () => {
    renderPage();
    expect(ButtonRoute.path).toBe("/button");
    expect(ButtonRoute.category).toBe("Actions");
    expect(screen.getByRole("heading", { level: 1, name: "Button" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Button · Stackra Playground");
  });

  it("shows every variant in every size", () => {
    renderPage();
    const variants = section("Variants and sizes");
    for (const variant of ButtonVariant) {
      const buttons = variants.getAllByRole("button", { name: variant });
      expect(buttons, variant).toHaveLength(Size.length);
      for (const [index, size] of Size.entries()) {
        expect(buttons[index]?.classList.contains(`button--${variant}`)).toBe(true);
        expect(buttons[index]?.classList.contains(`button--${size}`)).toBe(true);
      }
    }
  });

  it("shows each variant default, disabled and loading", () => {
    renderPage();
    const states = section("States");
    expect(states.getAllByRole("button", { name: "Default" })).toHaveLength(ButtonVariant.length);
    for (const button of states.getAllByRole("button", { name: "Disabled" }))
      expect((button as HTMLButtonElement).disabled).toBe(true);
    for (const button of states.getAllByRole("button", { name: "Loading" }))
      expect(button.hasAttribute("data-pending")).toBe(true);
  });

  it("shows the icons and the full-width buttons", () => {
    renderPage();
    expect(
      section("Icons").getByRole("button", { name: "Download" }).querySelectorAll("svg"),
    ).toHaveLength(2);
    for (const button of section("Full width").getAllByRole("button"))
      expect(button.classList.contains("button--full-width")).toBe(true);
  });

  it("loads the save sample for a moment and then returns to idle", () => {
    vi.useFakeTimers();
    renderPage();
    const live = section("Try it");
    const save = live.getByRole("button", { name: "Save" });
    expect(screen.getByTestId("save-state").textContent).toBe("Idle.");
    act(() => save.click());
    expect(save.hasAttribute("data-pending")).toBe(true);
    expect(screen.getByTestId("save-state").textContent).toBe("Saving…");
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(save.hasAttribute("data-pending")).toBe(false);
    expect(screen.getByTestId("save-state").textContent).toBe("Idle.");
  });

  it("counts presses on the live button and not on the disabled one", () => {
    renderPage();
    const live = section("Try it");
    const count = screen.getByTestId("press-count");
    expect(count.textContent).toBe("Pressed 0 times.");
    act(() => live.getByRole("button", { name: "Count" }).click());
    expect(count.textContent).toBe("Pressed 1 time.");
    act(() => live.getByRole("button", { name: "Count (disabled)" }).click());
    expect(count.textContent).toBe("Pressed 1 time.");
  });
});
