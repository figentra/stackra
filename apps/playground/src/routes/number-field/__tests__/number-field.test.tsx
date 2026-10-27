/**
 * Stackra file contract:
 * Purpose: proves the number-field page titles the document, shows a plain and a bounded field (the bounded one moving a
 *          typed value to its bound), a percentage and a currency written by their format, a field without buttons that
 *          the arrow keys still step, the invalid, disabled and read-only states, and that the live field steps, takes
 *          typed text, clamps it and shows the number it holds or that it is empty.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0318 (decision 9); ADR 0022 (test placement).
 */
// @covers sta-350:FR-204 sta-350:P-079
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { NumberField } from "#src/routes/number-field/number-field";
import { NumberFieldRoute } from "#src/routes/number-field/number-field.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <NumberField />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const field = (scope: ReturnType<typeof section>, name: string | RegExp) =>
  scope.getByRole("textbox", { name }) as HTMLInputElement;
const typeInto = (input: HTMLElement, text: string) => {
  fireEvent.change(input, { target: { value: text } });
  fireEvent.blur(input);
};

describe("Number field page", () => {
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

  it("titles the page and the document, and sits at /number-field under Inputs and forms", () => {
    renderPage();
    expect(routePath(NumberFieldRoute)).toBe("/number-field");
    expect(NumberFieldRoute.category).toBe("Inputs and forms");
    expect(screen.getByRole("heading", { level: 1, name: "Number field" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Number field · Stackra Playground");
  });

  it("shows a plain field and a bounded one, which moves a typed value to its bound", () => {
    renderPage();
    const basics = section("Basics");
    const plain = field(basics, "Quantity");
    expect(plain.value).toBe("2");
    expect(basics.getByText("Type a number or step it with the buttons.")).toBeTruthy();
    const bounded = field(basics, "Seats, 1 to 10");
    typeInto(bounded, "40");
    expect(bounded.value).toBe("10");
    typeInto(bounded, "0");
    expect(bounded.value).toBe("1");
  });

  it("writes a percentage and a currency by their format", () => {
    renderPage();
    const formats = section("Formats");
    expect(field(formats, "Discount").value).toBe("15%");
    expect(field(formats, "Price").value).toBe("$1,299.50");
    typeInto(field(formats, "Discount"), "250");
    expect(field(formats, "Discount").value).toBe("100%");
    typeInto(field(formats, "Discount"), "15");
    fireEvent.keyDown(field(formats, "Discount"), { key: "ArrowUp" });
    expect(field(formats, "Discount").value).toBe("20%");
    fireEvent.keyDown(field(formats, "Price"), { key: "ArrowUp" });
    expect(field(formats, "Price").value).toBe("$1,300.00");
  });

  it("shows a field without buttons that the arrow keys still step", () => {
    renderPage();
    const steppers = section("Without buttons");
    const input = field(steppers, "Years of experience");
    expect(steppers.queryAllByRole("button")).toHaveLength(0);
    expect(input.value).toBe("3");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("4");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.value).toBe("2");
  });

  it("shows the invalid, disabled and read-only states", () => {
    renderPage();
    const states = section("States");
    expect(states.getByText("Enter at least one guest.")).toBeTruthy();
    expect(field(states, "Guests").getAttribute("aria-invalid")).toBe("true");
    expect(field(states, "Rooms").hasAttribute("disabled")).toBe(true);
    expect(field(states, "Floors").hasAttribute("readonly")).toBe(true);
    expect(field(states, "Floors").value).toBe("5");
  });

  it("shows the live field's number, steps it and clamps typed text", () => {
    renderPage();
    const live = section("Try it");
    const input = field(live, "Seats to book");
    expect(live.getByTestId("number-field-value").textContent).toBe("4 seats chosen.");
    act(() => live.getByRole("button", { name: "Increase" }).click());
    expect(live.getByTestId("number-field-value").textContent).toBe("5 seats chosen.");
    typeInto(input, "1");
    expect(live.getByTestId("number-field-value").textContent).toBe("1 seat chosen.");
    typeInto(input, "40");
    expect(live.getByTestId("number-field-value").textContent).toBe("10 seats chosen.");
    expect(input.value).toBe("10");
    typeInto(input, "");
    expect(live.getByTestId("number-field-value").textContent).toBe("No seats chosen yet.");
    expect(input.value).toBe("");
  });
});
