/**
 * Stackra file contract:
 * Purpose: proves the checkbox page titles the document, shows one checkbox per state with its caption, shows both
 *          variants, names a label-less checkbox, hides the error message once the invalid sample is checked, and
 *          drives the select-all parent: a dash while some children are checked, all on a press, none on the next.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-082 sta-350:FR-086 sta-350:FR-089
import { DesignSystemProvider } from "@stackra/ui/react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { Checkbox } from "#src/routes/checkbox/checkbox";
import { CheckboxRoute } from "#src/routes/checkbox/checkbox.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Checkbox />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const box = (name: string | RegExp) => screen.getByRole("checkbox", { name }) as HTMLInputElement;
const parent = () => box("Select all toppings");

describe("Checkbox page", () => {
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

  it("titles the page and the document, and sits at /checkbox under Selection", () => {
    renderPage();
    expect(routePath(CheckboxRoute)).toBe("/checkbox");
    expect(CheckboxRoute.category).toBe("Selection");
    expect(screen.getByRole("heading", { level: 1, name: "Checkbox" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Checkbox · Stackra Playground");
  });

  it("shows one checkbox per state, each under its caption", () => {
    renderPage();
    const states = section("States");
    expect(states.getAllByRole("checkbox")).toHaveLength(9);
    expect(states.getByText("Indeterminate")).toBeTruthy();
    expect(box("Subscribe to the newsletter").checked).toBe(false);
    expect(box("Remember this device").checked).toBe(true);
    expect(box("Select every invoice").indeterminate).toBe(true);
    expect(box("Share usage data").disabled).toBe(true);
    expect(box("Use the company sign-in")).toMatchObject({ disabled: true, checked: true });
    expect(box("Your plan includes backups").checked).toBe(true);
    expect(box(/I accept the terms/).required).toBe(true);
  });

  it("shows a description with its checkbox and the error message of the invalid sample until it is checked", () => {
    renderPage();
    expect(screen.getByText("At most one email a month.")).toBeTruthy();
    expect(screen.getByText("Confirm your age to continue.")).toBeTruthy();
    fireEvent.click(box("I am over eighteen"));
    expect(screen.queryByText("Confirm your age to continue.")).toBeNull();
  });

  it("shows both variants, and a checkbox named only by its aria-label", () => {
    renderPage();
    const variants = section("Variants");
    expect(variants.getAllByRole("checkbox")).toHaveLength(4);
    expect(box("Primary, checked").closest('[data-slot="checkbox"]')?.className).toContain(
      "checkbox--primary",
    );
    expect(box("Secondary, checked").closest('[data-slot="checkbox"]')?.className).toContain(
      "checkbox--secondary",
    );
    expect(
      section("Without a visible label").getByRole("checkbox", { name: "Select row 3" }),
    ).toBeTruthy();
  });

  it("drives the select-all parent: a dash while some are checked, all on a press, none on the next", () => {
    renderPage();
    const live = section("Try it");
    expect(parent().indeterminate).toBe(true);
    expect(live.getByRole("status").textContent).toBe("Chosen: Cheese");
    fireEvent.click(parent());
    expect(live.getAllByRole("checkbox").every((item) => (item as HTMLInputElement).checked)).toBe(
      true,
    );
    expect(live.getByRole("status").textContent).toBe("Chosen: Cheese, Olives, Basil");
    expect(parent().indeterminate).toBe(false);
    fireEvent.click(parent());
    expect(live.getByRole("status").textContent).toBe("Chosen: none");
  });

  it("checks a child on its own and clears them all with the button", () => {
    renderPage();
    const live = section("Try it");
    fireEvent.click(live.getByRole("checkbox", { name: "Olives" }));
    expect(live.getByRole("status").textContent).toBe("Chosen: Cheese, Olives");
    fireEvent.click(live.getByRole("button", { name: "Clear" }));
    expect(live.getByRole("status").textContent).toBe("Chosen: none");
  });
});
