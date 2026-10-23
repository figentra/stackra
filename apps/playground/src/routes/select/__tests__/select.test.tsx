/**
 * Stackra file contract:
 * Purpose: proves the select page titles the document, shows the labelled, described and name-only fields, the items
 *          with descriptions, each state, and a live field whose chosen key is reported and cleared from outside.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-081
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Select } from "#src/routes/select/select";
import { SelectRoute } from "#src/routes/select/select.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <Select />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("Select page", () => {
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

  it("titles the page and the document, and sits at /select under Selection", () => {
    renderPage();
    expect(SelectRoute.path).toBe("/select");
    expect(SelectRoute.category).toBe("Selection");
    expect(screen.getByRole("heading", { level: 1, name: "Select" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Select · Stackra Playground");
  });

  it("shows a labelled field, a described one and one named without a visible label", () => {
    renderPage();
    const basics = section("Basics");
    expect(basics.getByRole("button", { name: /Order status/ })).toBeTruthy();
    const described = basics.getByRole("button", { name: /Shipping method/ });
    expect(described.getAttribute("aria-describedby")).toContain(
      basics.getByText("How the order leaves the warehouse.").id,
    );
    expect(basics.getByRole("button", { name: /Sort orders by/ })).toBeTruthy();
  });

  it("lists the plans with their descriptions and refuses the disabled one", () => {
    renderPage();
    press(section("Items").getByRole("button", { name: /Plan/ }));
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.map((option) => option.getAttribute("data-key"))).toEqual([
      "free",
      "team",
      "scale",
      "legacy",
    ]);
    expect(options[0]?.textContent).toContain("For one person");
    expect(options[3]?.getAttribute("aria-disabled")).toBe("true");
  });

  it("shows each state, and a read-only field never opens", () => {
    renderPage();
    const states = section("States");
    expect(states.getByText("Choose a status before you continue.")).toBeTruthy();
    expect(states.getByRole<HTMLButtonElement>("button", { name: /Disabled/ }).disabled).toBe(true);
    press(states.getByRole("button", { name: /Read-only/ }));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("reports the chosen key and clears it from outside", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("Chosen key: none")).toBeTruthy();
    press(live.getByRole("button", { name: /Status of the shipment/ }));
    press(screen.getByRole("option", { name: "Paid" }));
    expect(live.getByText("Chosen key: paid")).toBeTruthy();
    press(live.getByRole("button", { name: "Clear the choice" }));
    expect(live.getByText("Chosen key: none")).toBeTruthy();
  });
});
