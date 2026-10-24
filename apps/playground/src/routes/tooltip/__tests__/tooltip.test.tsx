/**
 * Stackra file contract:
 * Purpose: proves the tooltip page titles the document, lists every placement, alignment, arrow, icon button and delay
 *          sample as a named element, shows a tooltip on keyboard focus that describes its element without renaming
 *          it, stays quiet for the switched-off sample, and shows the live tooltip while its switch is on and reports
 *          the state.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded, so where a
 *           tooltip lands and how long a hover takes are checked by the e2e suite.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-111
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Tooltip } from "#src/routes/tooltip/tooltip";
import { TooltipRoute } from "#src/routes/tooltip/tooltip.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <Tooltip />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

/** Puts the page in keyboard modality, then focuses the element: React Aria shows a tooltip on keyboard focus only. */
function focusByKeyboard(element: HTMLElement) {
  fireEvent.keyDown(document.body, { key: "Tab" });
  act(() => element.focus());
}

/** The names of the buttons in a region: an aria-label where there is one, the text otherwise. */
const namesIn = (region: string) =>
  section(region)
    .getAllByRole("button")
    .map((button) => button.getAttribute("aria-label") ?? button.textContent);

describe("Tooltip page", () => {
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

  it("titles the page and the document, and sits at /tooltip under Overlays", () => {
    renderPage();
    expect(TooltipRoute.path).toBe("/tooltip");
    expect(TooltipRoute.category).toBe("Overlays");
    expect(screen.getByRole("heading", { level: 1, name: "Tooltip" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Tooltip · Stackra Playground");
  });

  it("shows every side, alignment, arrow, icon button and delay as a named element", () => {
    renderPage();
    expect(namesIn("Placement")).toEqual(["Top", "Bottom", "Start", "End"]);
    expect(namesIn("Alignment")).toEqual(["Align start", "Align centre", "Align end"]);
    expect(namesIn("Arrow")).toEqual(["No arrow", "With an arrow"]);
    expect(namesIn("On icon buttons")).toEqual(["Settings", "Alerts", "Download"]);
    expect(namesIn("Delay and switching off")).toEqual([
      "Default delay",
      "No delay",
      "Switched off",
    ]);
  });

  it("shows a tooltip on keyboard focus that describes the icon button and leaves its name", () => {
    renderPage();
    const button = section("On icon buttons").getByRole("button", { name: "Settings" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    focusByKeyboard(button);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.textContent).toBe("Change your preferences");
    expect(button.getAttribute("aria-describedby")).toBe(tooltip.id);
    expect(button.getAttribute("aria-label")).toBe("Settings");
  });

  it("stays quiet for the switched-off sample", () => {
    renderPage();
    focusByKeyboard(
      section("Delay and switching off").getByRole("button", { name: "Switched off" }),
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("shows the live tooltip while the switch is on and reports the state", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("State: hidden")).toBeTruthy();
    expect(screen.queryByRole("tooltip")).toBeNull();
    act(() => live.getByRole("switch", { name: "Show the tooltip" }).click());
    expect(screen.getByRole("tooltip").textContent).toBe("Export the table as CSV");
    expect(live.getByText("State: shown")).toBeTruthy();
  });
});
