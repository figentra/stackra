/**
 * Stackra file contract:
 * Purpose: proves the popover page titles the document, lists every placement, alignment, content and dismissal sample
 *          as a named trigger, opens a popover as a dialog named by its title or its aria-label, keeps the step popover
 *          open on Escape only when Escape is disabled, and reports the live popover's state when it is opened from
 *          outside and closed again.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded, so where a
 *           popover lands and what a press outside does are checked by the e2e suite.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-110
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Popover } from "#src/routes/popover/popover";
import { PopoverRoute } from "#src/routes/popover/popover.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <Popover />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

/** The names of the buttons in a region: an aria-label where there is one, the text otherwise. */
const namesIn = (region: string) =>
  section(region)
    .getAllByRole("button")
    .map((button) => button.textContent);

describe("Popover page", () => {
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

  it("titles the page and the document, and sits at /popover under Overlays", () => {
    renderPage();
    expect(PopoverRoute.path).toBe("/popover");
    expect(PopoverRoute.category).toBe("Overlays");
    expect(screen.getByRole("heading", { level: 1, name: "Popover" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Popover · Stackra Playground");
  });

  it("shows every side, alignment, content form and dismissal rule as a trigger", () => {
    renderPage();
    expect(namesIn("Placement")).toEqual(["Top", "Bottom", "Start", "End"]);
    expect(namesIn("Alignment")).toEqual(["Align start", "Align centre", "Align end"]);
    expect(namesIn("Content")).toEqual([
      "With a title",
      "With an arrow",
      "Named by aria-label",
      "With a field",
    ]);
    expect(namesIn("Dismissal")).toEqual([
      "Closes anywhere",
      "Refuses a press outside",
      "Refuses Escape",
    ]);
  });

  it("opens a dialog named by its title, and one named by its aria-label", () => {
    renderPage();
    press(section("Content").getByRole("button", { name: "With a title" }));
    expect(screen.getByRole("dialog", { name: "Delivery window" })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    press(section("Content").getByRole("button", { name: "Named by aria-label" }));
    expect(screen.getByRole("dialog", { name: "Order reference" })).toBeTruthy();
  });

  it("keeps a popover open on Escape when Escape is disabled, and closes it from inside", () => {
    renderPage();
    press(section("Dismissal").getByRole("button", { name: "Refuses Escape" }));
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Unsaved changes" }), { key: "Escape" });
    expect(screen.getByRole("dialog", { name: "Unsaved changes" })).toBeTruthy();
    press(within(screen.getByRole("dialog")).getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("reports the live popover's state, opened from outside and closed with Escape", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("State: closed")).toBeTruthy();
    press(live.getByRole("button", { name: "Open from outside" }));
    expect(screen.getByRole("dialog", { name: "Order actions" })).toBeTruthy();
    expect(screen.getByText("State: open")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByText("State: closed")).toBeTruthy();
  });
});
