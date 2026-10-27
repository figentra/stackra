/**
 * Stackra file contract:
 * Purpose: proves the icon-button page titles the document, shows one named icon button per variant in every size, the disabled and loading states, and counts presses.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-027 sta-350:P-018
import { ButtonVariant, Size } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { IconButton } from "#src/routes/icon-button/icon-button";
import { IconButtonRoute } from "#src/routes/icon-button/icon-button.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <IconButton />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("IconButton page", () => {
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

  it("titles the page and the document, and sits at /icon-button under Actions", () => {
    renderPage();
    expect(routePath(IconButtonRoute)).toBe("/icon-button");
    expect(IconButtonRoute.category).toBe("Actions");
    expect(screen.getByRole("heading", { level: 1, name: "Icon button" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Icon button · Stackra Playground");
  });

  it("shows a named icon-only button for every variant in every size", () => {
    renderPage();
    const variants = section("Variants and sizes");
    const buttons = variants.getAllByRole("button");
    expect(buttons).toHaveLength(ButtonVariant.length * Size.length);
    for (const button of buttons) {
      expect(button.classList.contains("button--icon-only")).toBe(true);
      expect(button.getAttribute("aria-label")).toMatch(/^(Settings|Delete)$/);
    }
    expect(variants.getAllByRole("button", { name: "Delete" })).toHaveLength(2 * Size.length);
  });

  it("shows the disabled and loading states", () => {
    renderPage();
    const states = section("States");
    expect((states.getByRole("button", { name: "Disabled" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(states.getByRole("button", { name: "Loading" }).hasAttribute("data-pending")).toBe(true);
  });

  it("counts presses and loads for a moment", () => {
    vi.useFakeTimers();
    renderPage();
    const live = section("Try it");
    act(() => live.getByRole("button", { name: "Count presses" }).click());
    expect(screen.getByTestId("press-count").textContent).toBe("Pressed 1 time.");
    const load = live.getByRole("button", { name: "Load" });
    act(() => load.click());
    expect(load.hasAttribute("data-pending")).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(load.hasAttribute("data-pending")).toBe(false);
  });
});
