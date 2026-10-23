/**
 * Stackra file contract:
 * Purpose: proves the close-button page titles the document, names every close button by its label, shows the default mark and a custom icon, and that dismissing the sample notice hides it until Show again restores it.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-027
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { CloseButton } from "#src/routes/close-button/close-button";
import { CloseButtonRoute } from "#src/routes/close-button/close-button.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <CloseButton />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("CloseButton page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /close-button under Actions", () => {
    renderPage();
    expect(CloseButtonRoute.path).toBe("/close-button");
    expect(CloseButtonRoute.category).toBe("Actions");
    expect(screen.getByRole("heading", { level: 1, name: "Close button" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Close button · Stackra Playground");
  });

  it("names every close button by its label and shows the default mark and a custom icon", () => {
    renderPage();
    const forms = section("Forms");
    const buttons = forms.getAllByRole("button");
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Close",
      "Dismiss with a custom icon",
      "Close (disabled)",
    ]);
    expect(buttons[0]?.querySelector('[data-slot="close-button-icon"]')).toBeTruthy();
    expect(buttons[1]?.querySelector('[data-slot="close-button-icon"]')).toBeNull();
    expect(buttons[1]?.querySelector("svg")).toBeTruthy();
    expect((buttons[2] as HTMLButtonElement).disabled).toBe(true);
  });

  it("hides the notice on dismiss and brings it back with Show again", () => {
    renderPage();
    const use = section("In use");
    expect(use.getByRole("heading", { name: "Your changes were saved" })).toBeTruthy();
    act(() => use.getByRole("button", { name: "Dismiss notice" }).click());
    expect(use.queryByRole("heading", { name: "Your changes were saved" })).toBeNull();
    expect(use.getByRole("status").textContent).toBe("The notice is hidden.");
    act(() => use.getByRole("button", { name: "Show again" }).click());
    expect(use.getByRole("heading", { name: "Your changes were saved" })).toBeTruthy();
  });
});
