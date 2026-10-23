/**
 * Stackra file contract:
 * Purpose: proves the checkbox-group page titles the document, shows the basic group with its descriptions, one group
 *          per state, both variants, hides the error message once the invalid sample has a choice, and drives the live
 *          group: its readout, the choose-all button and the clear button.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-082 sta-350:FR-084 sta-350:FR-086 sta-350:FR-089
import { DesignSystemProvider } from "@stackra/ui/react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { CheckboxGroup } from "#src/routes/checkbox-group/checkbox-group";
import { CheckboxGroupRoute } from "#src/routes/checkbox-group/checkbox-group.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <CheckboxGroup />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const group = (name: string) => within(screen.getByRole("group", { name }));

describe("CheckboxGroup page", () => {
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

  it("titles the page and the document, and sits at /checkbox-group under Selection", () => {
    renderPage();
    expect(CheckboxGroupRoute.path).toBe("/checkbox-group");
    expect(CheckboxGroupRoute.category).toBe("Selection");
    expect(screen.getByRole("heading", { level: 1, name: "Checkbox group" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Checkbox group · Stackra Playground");
  });

  it("shows the basic group with its descriptions", () => {
    renderPage();
    const basic = group("Notify me by");
    expect(basic.getAllByRole("checkbox")).toHaveLength(3);
    expect((basic.getByRole("checkbox", { name: "Email" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText("A weekly digest.")).toBeTruthy();
    expect(screen.getByText("You can change this at any time.")).toBeTruthy();
  });

  it("shows one group per state", () => {
    renderPage();
    expect(section("States").getAllByRole("group")).toHaveLength(5);
    for (const box of group("Weekly reports").getAllByRole("checkbox"))
      expect((box as HTMLInputElement).disabled).toBe(true);
    expect(
      (group("Export formats").getByRole("checkbox", { name: "PDF" }) as HTMLInputElement).disabled,
    ).toBe(true);
    expect(group("Export formats").getByRole("checkbox", { name: "CSV" })).toHaveProperty(
      "disabled",
      false,
    );
    expect(
      (group("Included in your plan").getByRole("checkbox", { name: "CSV" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
  });

  it("shows the error message of the invalid sample until a day is chosen", () => {
    renderPage();
    expect(screen.getByText("Choose a delivery day to continue.")).toBeTruthy();
    fireEvent.click(group("Delivery days").getByRole("checkbox", { name: "Monday" }));
    expect(screen.queryByText("Choose a delivery day to continue.")).toBeNull();
  });

  it("shows both variants", () => {
    renderPage();
    const variants = section("Variants");
    expect(variants.getAllByRole("group")).toHaveLength(2);
  });

  it("lists the chosen keys in the readout and chooses all or none from the buttons", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByRole("status").textContent).toBe("Chosen: cheese");
    fireEvent.click(live.getByRole("checkbox", { name: "Basil" }));
    expect(live.getByRole("status").textContent).toBe("Chosen: cheese, basil");
    fireEvent.click(live.getByRole("button", { name: "Choose all" }));
    expect(live.getByRole("status").textContent).toBe("Chosen: cheese, olives, basil, chilli");
    fireEvent.click(live.getByRole("button", { name: "Clear" }));
    expect(live.getByRole("status").textContent).toBe("Chosen: none");
  });
});
