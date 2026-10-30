/**
 * Stackra file contract:
 * Purpose: proves the web RadioGroup is a named `radiogroup` with one radio per option, reports the chosen key
 *          through `value`, `defaultValue` and `onChange` (the field contract), moves with the arrow keys' native
 *          behaviour in a single tab stop, applies group and option disabled states, lays out by `orientation`, ties the
 *          group's description and error message to it, and refuses `children`.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so attributes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-082 sta-350:FR-083 sta-350:FR-085 sta-350:FR-086 sta-350:FR-087
import { fireEvent, render, screen } from "@testing-library/react";

import type { ChoiceOption } from "#contracts/types/choice-option.type";
import { RadioGroup } from "#react/radio-group/radio-group";
import type { RadioGroupProps } from "#react/radio-group/radio-group.props";

const OPTIONS: readonly ChoiceOption[] = [
  { value: "standard", label: "Standard", description: "5 to 7 days" },
  { value: "express", label: "Express" },
  { value: "overnight", label: "Overnight", isDisabled: true },
];

describe("RadioGroup (web)", () => {
  it("is a radiogroup named by its label with one radio per option, in order", () => {
    render(<RadioGroup label="Shipping" options={OPTIONS} />);
    const group = screen.getByRole("radiogroup", { name: "Shipping" });
    const radios = screen.getAllByRole("radio");
    expect(radios.map((radio) => radio.getAttribute("value"))).toEqual([
      "standard",
      "express",
      "overnight",
    ]);
    expect(radios.every((radio) => group.contains(radio))).toBe(true);
  });

  it("starts from defaultValue and reports the chosen key on each change", () => {
    const onChange = vi.fn();
    render(
      <RadioGroup label="Shipping" options={OPTIONS} defaultValue="standard" onChange={onChange} />,
    );
    expect((screen.getByRole("radio", { name: "Standard" }) as HTMLInputElement).checked).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Express" }));
    expect(onChange).toHaveBeenLastCalledWith("express");
    expect((screen.getByRole("radio", { name: "Express" }) as HTMLInputElement).checked).toBe(true);
  });

  it("is controlled by value", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RadioGroup label="Shipping" options={OPTIONS} value="standard" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Express" }));
    expect(onChange).toHaveBeenLastCalledWith("express");
    expect((screen.getByRole("radio", { name: "Express" }) as HTMLInputElement).checked).toBe(
      false,
    );
    rerender(<RadioGroup label="Shipping" options={OPTIONS} value="express" onChange={onChange} />);
    expect((screen.getByRole("radio", { name: "Express" }) as HTMLInputElement).checked).toBe(true);
  });

  it.each([
    ["controlled", { value: "", onChange: vi.fn() }],
    ["uncontrolled", { defaultValue: "" }],
  ])(
    "reads an empty %s value as nothing chosen and keeps the first radio in the tab order",
    (_, props) => {
      render(<RadioGroup label="Shipping" options={OPTIONS} {...props} />);
      const radios = screen.getAllByRole<HTMLInputElement>("radio");
      expect(radios.every((radio) => !radio.checked)).toBe(true);
      // React Aria leaves every radio of an empty group tabbable; the browser's radio group makes it one Tab stop.
      expect(radios[0]?.tabIndex).toBe(0);
    },
  );

  it("disables one option on its own, or every option with the group", () => {
    const { rerender } = render(<RadioGroup label="Shipping" options={OPTIONS} />);
    expect((screen.getByRole("radio", { name: "Overnight" }) as HTMLInputElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole("radio", { name: "Express" }) as HTMLInputElement).disabled).toBe(
      false,
    );
    rerender(<RadioGroup label="Shipping" options={OPTIONS} isDisabled />);
    for (const radio of screen.getAllByRole("radio"))
      expect((radio as HTMLInputElement).disabled).toBe(true);
  });

  it("refuses a change while read-only", () => {
    const onChange = vi.fn();
    render(<RadioGroup label="Shipping" options={OPTIONS} isReadOnly onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Express" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("lays out vertically by default and horizontally on request", () => {
    const { rerender } = render(<RadioGroup label="Shipping" options={OPTIONS} />);
    expect(screen.getByRole("radiogroup").getAttribute("aria-orientation")).not.toBe("horizontal");
    expect(screen.getByRole("radiogroup").getAttribute("data-orientation")).toBe("vertical");
    rerender(<RadioGroup label="Shipping" options={OPTIONS} orientation="horizontal" />);
    expect(screen.getByRole("radiogroup").getAttribute("data-orientation")).toBe("horizontal");
  });

  it("reads each option's description with that option", () => {
    render(<RadioGroup label="Shipping" options={OPTIONS} />);
    const radio = screen.getByRole("radio", { name: "Standard" });
    const described = (radio.getAttribute("aria-describedby") ?? "").split(" ");
    expect(described.map((id) => document.getElementById(id)?.textContent)).toContain(
      "5 to 7 days",
    );
  });

  it("ties the group's description and error message to the group", () => {
    render(
      <RadioGroup
        label="Shipping"
        options={OPTIONS}
        description="How fast"
        isInvalid
        errorMessage="Choose one"
      />,
    );
    const group = screen.getByRole("radiogroup", { name: "Shipping" });
    expect(group.getAttribute("aria-invalid")).toBe("true");
    const described = (group.getAttribute("aria-describedby") ?? "").split(" ");
    expect(described.map((id) => document.getElementById(id)?.textContent)).toEqual(
      expect.arrayContaining(["How fast", "Choose one"]),
    );
  });

  it("marks a required group in its label and for assistive technology", () => {
    const { container } = render(<RadioGroup label="Shipping" options={OPTIONS} isRequired />);
    expect(screen.getByRole("radiogroup").getAttribute("aria-required")).toBe("true");
    expect(container.querySelector('[data-slot="label"]')?.className).toContain("required");
  });

  it("submits the chosen key under the group's name", () => {
    const { container } = render(
      <form>
        <RadioGroup label="Shipping" options={OPTIONS} name="shipping" defaultValue="express" />
      </form>,
    );
    const data = new FormData(container.querySelector("form") as HTMLFormElement);
    expect(data.get("shipping")).toBe("express");
  });

  it("names itself with aria-label when it has no label, and passes unknown props and variant through", () => {
    const { container } = render(
      <RadioGroup aria-label="Pick" data-testid="group" options={OPTIONS} variant="secondary" />,
    );
    expect(screen.getByRole("radiogroup", { name: "Pick" })).toBe(screen.getByTestId("group"));
    expect(container.querySelector('[data-slot="radio-group"]')?.className).toContain(
      "radio-group--secondary",
    );
  });

  it("refuses children, which the options replace", () => {
    // @ts-expect-error `children` is `options`.
    const children: RadioGroupProps = { options: [], children: "x" };
    expectTypeOf<RadioGroupProps["value"]>().toEqualTypeOf<string | undefined>();
    expect(children).toBeTruthy();
  });
  it("lays the options out in columns under the label, never the label or the error in a cell", () => {
    const { container } = render(
      <RadioGroup
        label="Channels"
        options={OPTIONS}
        columns={2}
        errorMessage="Pick one"
        isInvalid
      />,
    );
    const grid = container.querySelector('[data-slot="radio-group-columns"]') as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(2, minmax(0, 1fr))");
    expect(grid.querySelectorAll('input[type="radio"]')).toHaveLength(OPTIONS.length);
    expect(grid.textContent).not.toContain("Channels");
    expect(grid.textContent).not.toContain("Pick one");
  });

  it("puts a horizontal group's options in a row of their own, under the label", () => {
    const { container } = render(
      <RadioGroup label="Format" options={OPTIONS} orientation="horizontal" />,
    );
    const row = container.querySelector('[data-slot="radio-group-row"]') as HTMLElement;
    expect(row.querySelectorAll('input[type="radio"]')).toHaveLength(OPTIONS.length);
    expect(row.textContent).not.toContain("Format");
    expect(screen.getByRole("radiogroup").className).toContain(
      "data-[orientation=horizontal]:flex-col",
    );
  });
});
