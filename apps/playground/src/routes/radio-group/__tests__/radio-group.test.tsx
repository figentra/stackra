/**
 * Stackra file contract:
 * Purpose: proves the radio-group page titles the document, shows the vertical and horizontal groups, one group per
 *          state, both variants, hides the error message once the invalid sample has a choice, and drives the live
 *          group: its readout, a click and the buttons that choose from outside.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-082 sta-350:FR-085 sta-350:FR-086 sta-350:FR-089
import { DesignSystemProvider } from "@stackra/ui/react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { RadioGroup } from "#src/routes/radio-group/radio-group";
import { RadioGroupRoute } from "#src/routes/radio-group/radio-group.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <RadioGroup />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const group = (name: string) => within(screen.getByRole("radiogroup", { name }));
const radio = (scope: ReturnType<typeof group>, name: string) =>
  scope.getByRole("radio", { name }) as HTMLInputElement;

describe("RadioGroup page", () => {
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

  it("titles the page and the document, and sits at /radio-group under Selection", () => {
    renderPage();
    expect(routePath(RadioGroupRoute)).toBe("/radio-group");
    expect(RadioGroupRoute.category).toBe("Selection");
    expect(screen.getByRole("heading", { level: 1, name: "Radio group" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Radio group · Stackra Playground");
  });

  it("shows the vertical and the horizontal group", () => {
    renderPage();
    const layouts = section("Layouts");
    expect(layouts.getAllByRole("radiogroup")).toHaveLength(2);
    expect(radio(group("Shipping speed"), "Standard").checked).toBe(true);
    expect(screen.getByText("Delivered in 2 to 3 days.")).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "Size" }).getAttribute("data-orientation")).toBe(
      "horizontal",
    );
  });

  it("shows one group per state", () => {
    renderPage();
    expect(section("States").getAllByRole("radiogroup")).toHaveLength(5);
    for (const item of group("Billing cycle").getAllByRole("radio"))
      expect((item as HTMLInputElement).disabled).toBe(true);
    expect(radio(group("Payment method"), "Cheque").disabled).toBe(true);
    expect(radio(group("Payment method"), "Card").disabled).toBe(false);
    expect(radio(group("Your plan"), "Yearly").checked).toBe(true);
    expect(
      screen.getByRole("radiogroup", { name: /Account type/ }).getAttribute("aria-required"),
    ).toBe("true");
  });

  it("shows the error message of the invalid sample until an option is chosen", () => {
    renderPage();
    expect(screen.getByText("Choose a delivery window to continue.")).toBeTruthy();
    fireEvent.click(radio(group("Delivery window"), "Monthly"));
    expect(screen.queryByText("Choose a delivery window to continue.")).toBeNull();
  });

  it("shows both variants", () => {
    renderPage();
    expect(section("Variants").getAllByRole("radiogroup")).toHaveLength(2);
  });

  it("shows the chosen key in the readout, from a click and from the buttons", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByRole("status").textContent).toBe("Chosen: apple");
    fireEvent.click(live.getByRole("radio", { name: "Plum" }));
    expect(live.getByRole("status").textContent).toBe("Chosen: plum");
    fireEvent.click(live.getByRole("button", { name: "Choose pear" }));
    expect(live.getByRole("status").textContent).toBe("Chosen: pear");
    expect((live.getByRole("radio", { name: "Pear" }) as HTMLInputElement).checked).toBe(true);
  });
});
