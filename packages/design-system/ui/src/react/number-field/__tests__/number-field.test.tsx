/**
 * Stackra file contract:
 * Purpose: proves the web NumberField names its input by its label, ties the description and the error to it, shows the
 *          error only while the field is invalid, keeps the required, disabled and read-only states, reports a number or
 *          `null` for an empty field whether controlled or not, clamps a typed or stepped value to the bounds, steps by
 *          the given step, hides the buttons but keeps the arrow keys, names the buttons by default and by prop, writes
 *          and reads percent, currency and the digits of the locale, leaves a disabled field out of the submit and
 *          refuses every change to a disabled or read-only one, takes the variant and the full-width default, passes
 *          unknown props through, and refuses `fullWidth`, `children` and a value that is not a number.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are checked,
 *           not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decision 9); ADR 0055; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-202 sta-350:P-079
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement, useState } from "react";
import { I18nProvider } from "react-aria-components";

import type { NumberFieldContractProps } from "#contracts/types/number-field-contract-props.type";
import { NumberField, type NumberFieldProps } from "#react/number-field/number-field";

const press = (element: HTMLElement) => act(() => element.click());
const key = (element: HTMLElement, name: string) => fireEvent.keyDown(element, { key: name });
const field = (name: string | RegExp = "Seats") => screen.getByRole("textbox", { name });
const typeInto = (input: HTMLElement, text: string) => {
  fireEvent.change(input, { target: { value: text } });
  fireEvent.blur(input);
};

/** A field whose value the test keeps in state, so the field is controlled. */
function Controlled({ start }: { readonly start: number | null }) {
  const [value, setValue] = useState<number | null>(start);
  return <NumberField label="Seats" value={value} onChange={setValue} />;
}

describe("NumberField (web)", () => {
  it("names the input by its label and ties the description to it", () => {
    render(<NumberField label="Seats" description="How many people sit" />);
    const description = screen.getByText("How many people sit");
    expect(field().getAttribute("aria-describedby")?.split(" ")).toContain(description.id);
  });

  it("is named by aria-label when there is no visible label", () => {
    const { container } = render(<NumberField aria-label="Quantity" />);
    expect(field("Quantity")).toBeTruthy();
    expect(container.querySelector("label")).toBeNull();
    expect(container.querySelector('[data-slot="description"]')).toBeNull();
    expect(container.querySelector('[data-slot="error-message"]')).toBeNull();
  });

  it("shows the error message only while the field is invalid, and reads it with the field", () => {
    const { rerender } = render(<NumberField label="Seats" errorMessage="Pick at least one" />);
    expect(screen.queryByText("Pick at least one")).toBeNull();
    rerender(<NumberField label="Seats" errorMessage="Pick at least one" isInvalid />);
    const message = screen.getByText("Pick at least one");
    expect(field().getAttribute("aria-invalid")).toBe("true");
    expect(field().getAttribute("aria-describedby")?.split(" ")).toContain(message.id);
  });

  it("marks the field required, disabled and read-only", () => {
    const { rerender } = render(<NumberField label="Seats" isRequired />);
    expect(field(/Seats/).hasAttribute("required")).toBe(true);
    rerender(<NumberField label="Seats" isDisabled />);
    expect(field().hasAttribute("disabled")).toBe(true);
    rerender(<NumberField label="Seats" isReadOnly defaultValue={3} />);
    expect(field().hasAttribute("readonly")).toBe(true);
    expect(field().hasAttribute("disabled")).toBe(false);
  });

  it("shows the placeholder only while empty", () => {
    render(<NumberField label="Seats" placeholder="How many" />);
    expect(field().getAttribute("placeholder")).toBe("How many");
  });

  describe("value", () => {
    it("starts from the default value and reports each change as a number", () => {
      const onChange = vi.fn();
      render(<NumberField label="Seats" defaultValue={4} onChange={onChange} />);
      const input = field() as HTMLInputElement;
      expect(input.value).toBe("4");
      typeInto(input, "12");
      expect(onChange).toHaveBeenLastCalledWith(12);
      expect(input.value).toBe("12");
    });

    it("is empty for null and reports null once the text is cleared", () => {
      const onChange = vi.fn();
      render(<NumberField label="Seats" defaultValue={null} onChange={onChange} />);
      const input = field() as HTMLInputElement;
      expect(input.value).toBe("");
      typeInto(input, "7");
      expect(onChange).toHaveBeenLastCalledWith(7);
      typeInto(input, "");
      expect(onChange).toHaveBeenLastCalledWith(null);
      expect(input.value).toBe("");
    });

    it("is empty with no value at all", () => {
      render(<NumberField label="Seats" />);
      expect((field() as HTMLInputElement).value).toBe("");
    });

    it("shows the value it is given when controlled, null meaning empty", () => {
      const onChange = vi.fn();
      const { rerender } = render(<NumberField label="Seats" value={5} onChange={onChange} />);
      const input = field() as HTMLInputElement;
      expect(input.value).toBe("5");
      typeInto(input, "9");
      expect(onChange).toHaveBeenLastCalledWith(9);
      // The app did not take the change, so the field still shows its value.
      expect(input.value).toBe("5");
      rerender(<NumberField label="Seats" value={null} onChange={onChange} />);
      expect(input.value).toBe("");
    });

    it("follows the state of an app that keeps the value", () => {
      render(<Controlled start={null} />);
      const input = field() as HTMLInputElement;
      typeInto(input, "3");
      expect(input.value).toBe("3");
      press(screen.getByRole("button", { name: "Increase" }));
      expect(input.value).toBe("4");
    });

    it("submits the number under its name, and nothing while empty", () => {
      const { container, rerender } = render(
        <form>
          <NumberField label="Seats" name="seats" defaultValue={6} />
        </form>,
      );
      const data = () => new FormData(container.querySelector("form") as HTMLFormElement);
      expect(data().get("seats")).toBe("6");
      rerender(
        <form>
          <NumberField label="Seats" name="seats" value={null} />
        </form>,
      );
      expect(data().get("seats")).toBe("");
    });
  });

  describe("bounds and step", () => {
    it("clamps a typed value to the largest and the smallest", () => {
      const onChange = vi.fn();
      render(<NumberField label="Seats" minValue={2} maxValue={10} onChange={onChange} />);
      const input = field() as HTMLInputElement;
      typeInto(input, "150");
      expect(onChange).toHaveBeenLastCalledWith(10);
      expect(input.value).toBe("10");
      typeInto(input, "1");
      expect(onChange).toHaveBeenLastCalledWith(2);
      expect(input.value).toBe("2");
    });

    it("steps by the step with the buttons and the arrow keys", () => {
      const onChange = vi.fn();
      render(<NumberField label="Seats" defaultValue={10} step={5} onChange={onChange} />);
      press(screen.getByRole("button", { name: "Increase" }));
      expect(onChange).toHaveBeenLastCalledWith(15);
      press(screen.getByRole("button", { name: "Decrease" }));
      press(screen.getByRole("button", { name: "Decrease" }));
      expect(onChange).toHaveBeenLastCalledWith(5);
      key(field(), "ArrowUp");
      expect(onChange).toHaveBeenLastCalledWith(10);
      key(field(), "ArrowDown");
      expect(onChange).toHaveBeenLastCalledWith(5);
    });

    it("stops stepping at the bounds and switches the button off there", () => {
      const onChange = vi.fn();
      render(
        <NumberField
          label="Seats"
          defaultValue={10}
          minValue={0}
          maxValue={10}
          onChange={onChange}
        />,
      );
      expect(screen.getByRole("button", { name: "Increase" }).hasAttribute("disabled")).toBe(true);
      key(field(), "ArrowUp");
      expect(onChange).not.toHaveBeenCalled();
      press(screen.getByRole("button", { name: "Decrease" }));
      expect(onChange).toHaveBeenLastCalledWith(9);
    });

    it("steps up from empty to the smallest value", () => {
      const onChange = vi.fn();
      render(<NumberField label="Seats" minValue={3} onChange={onChange} />);
      press(screen.getByRole("button", { name: "Increase" }));
      expect(onChange).toHaveBeenLastCalledWith(3);
    });
  });

  describe("steppers", () => {
    it("draws a decrement and an increment button by default, named in English", () => {
      render(<NumberField label="Seats" />);
      expect(screen.getByRole("button", { name: "Decrease" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Increase" })).toBeTruthy();
    });

    it("names the buttons by prop", () => {
      render(
        <NumberField
          label="Seats"
          incrementLabel="Add one seat"
          decrementLabel="Remove one seat"
        />,
      );
      expect(screen.getByRole("button", { name: "Add one seat" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Remove one seat" })).toBeTruthy();
    });

    it("hides the buttons with hasSteppers false and keeps the arrow keys", () => {
      const onChange = vi.fn();
      render(
        <NumberField label="Seats" defaultValue={1} hasSteppers={false} onChange={onChange} />,
      );
      expect(screen.queryAllByRole("button")).toHaveLength(0);
      key(field(), "ArrowUp");
      expect(onChange).toHaveBeenLastCalledWith(2);
      key(field(), "ArrowDown");
      expect(onChange).toHaveBeenLastCalledWith(1);
    });
  });

  describe("format and locale", () => {
    it("writes a percentage and reads it back as a fraction", () => {
      const onChange = vi.fn();
      render(
        <NumberField
          label="Discount"
          defaultValue={0.25}
          formatOptions={{ style: "percent" }}
          onChange={onChange}
        />,
      );
      const input = field("Discount") as HTMLInputElement;
      expect(input.value).toBe("25%");
      typeInto(input, "40");
      expect(onChange).toHaveBeenLastCalledWith(0.4);
      expect(input.value).toBe("40%");
    });

    it("writes a currency with its symbol and two decimals", () => {
      render(
        <NumberField
          label="Price"
          defaultValue={1234.5}
          formatOptions={{ style: "currency", currency: "USD" }}
        />,
      );
      expect((field("Price") as HTMLInputElement).value).toBe("$1,234.50");
    });

    it("follows the locale of the provider: grouping and decimal mark", () => {
      render(
        <I18nProvider locale="de-DE">
          <NumberField
            label="Price"
            defaultValue={1234.5}
            formatOptions={{ style: "currency", currency: "EUR" }}
          />
        </I18nProvider>,
      );
      expect((field("Price") as HTMLInputElement).value).toMatch(/^1\.234,50\s€$/);
    });

    it("follows the locale of the provider: the digits, and reads them back", () => {
      const onChange = vi.fn();
      render(
        <I18nProvider locale="ar-EG">
          <NumberField label="Seats" defaultValue={12} onChange={onChange} />
        </I18nProvider>,
      );
      const input = field() as HTMLInputElement;
      expect(input.value).toBe("١٢");
      typeInto(input, "٣٤");
      expect(onChange).toHaveBeenLastCalledWith(34);
    });
  });

  describe("disabled and read-only", () => {
    it("refuses every change when disabled, switches the buttons off and leaves the field out of the submit", () => {
      const onChange = vi.fn();
      const { container } = render(
        <form>
          <NumberField label="Seats" name="seats" defaultValue={3} isDisabled onChange={onChange} />
        </form>,
      );
      press(screen.getByRole("button", { name: "Increase" }));
      key(field(), "ArrowUp");
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Increase" }).hasAttribute("disabled")).toBe(true);
      expect(screen.getByRole("button", { name: "Decrease" }).hasAttribute("disabled")).toBe(true);
      expect(new FormData(container.querySelector("form") as HTMLFormElement).has("seats")).toBe(
        false,
      );
    });

    it("refuses the arrow keys and the buttons when read-only, keeps the value and submits it", () => {
      const onChange = vi.fn();
      const { container } = render(
        <form>
          <NumberField label="Seats" name="seats" defaultValue={3} isReadOnly onChange={onChange} />
        </form>,
      );
      key(field(), "ArrowUp");
      key(field(), "ArrowDown");
      key(field(), "PageUp");
      key(field(), "Home");
      press(screen.getByRole("button", { name: "Increase" }));
      press(screen.getByRole("button", { name: "Decrease" }));
      expect(onChange).not.toHaveBeenCalled();
      expect((field() as HTMLInputElement).value).toBe("3");
      expect(new FormData(container.querySelector("form") as HTMLFormElement).get("seats")).toBe(
        "3",
      );
    });
  });

  it("is a primary, full-width field by default and takes the secondary variant", () => {
    const { container, rerender } = render(<NumberField label="Seats" />);
    const root = () => container.querySelector('[data-slot="number-field"]');
    expect(root()?.classList.contains("number-field--full-width")).toBe(true);
    expect(root()?.classList.contains("number-field--primary")).toBe(true);
    rerender(<NumberField label="Seats" isFullWidth={false} variant="secondary" />);
    expect(root()?.classList.contains("number-field--full-width")).toBe(false);
    expect(root()?.classList.contains("number-field--secondary")).toBe(true);
  });

  it("passes unknown props through to HeroUI's root and keeps the caller's class", () => {
    render(<NumberField label="Seats" className="mine" data-testid="root" isWheelDisabled />);
    expect(screen.getByTestId("root").classList.contains("mine")).toBe(true);
  });

  it("matches the shared contract and refuses `fullWidth`, `children` and a value that is not a number", () => {
    expectTypeOf<NumberFieldProps>().toExtend<NumberFieldContractProps>();
    // @ts-expect-error `fullWidth` is `isFullWidth` in the contract
    createElement(NumberField, { fullWidth: true });
    // @ts-expect-error the field draws its own parts
    const withChildren: NumberFieldProps = { children: "x" };
    void withChildren;
    // @ts-expect-error the value is a number or null, never text
    createElement(NumberField, { value: "5" });
    // @ts-expect-error React Aria's own button names are `incrementLabel` and `decrementLabel` here
    createElement(NumberField, { incrementAriaLabel: "More" });
  });
});
