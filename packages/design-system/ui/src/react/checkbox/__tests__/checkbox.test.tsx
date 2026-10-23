/**
 * Stackra file contract:
 * Purpose: proves the web Checkbox is named by its label, reads and reports its state through `value`,
 *          `defaultValue` and `onChange` (the field contract), shows the required, invalid, disabled, read-only and
 *          indeterminate states, ties the description and the error message to the input, passes unknown props and
 *          the HeroUI variant through, and refuses HeroUI's own names for what the contract already names.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are
 *          checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-082 sta-350:FR-083 sta-350:FR-086 sta-350:FR-087
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { Checkbox, type CheckboxProps } from "#react/checkbox/checkbox";

function Pair() {
  const [on, setOn] = useState(false);
  return <Checkbox label="Pair" value={on} onChange={setOn} />;
}

describe("Checkbox (web)", () => {
  it("is a checkbox named by its label and starts unchecked", () => {
    render(<Checkbox label="Accept the terms" />);
    const box = screen.getByRole("checkbox", { name: "Accept the terms" });
    expect((box as HTMLInputElement).checked).toBe(false);
  });

  it("starts from defaultValue and reports each change with the new state", () => {
    const onChange = vi.fn();
    render(<Checkbox label="News" defaultValue onChange={onChange} />);
    const box = screen.getByRole("checkbox", { name: "News" }) as HTMLInputElement;
    expect(box.checked).toBe(true);
    fireEvent.click(box);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(box.checked).toBe(false);
  });

  it("is controlled by value: it shows value and changes only when the owner does", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Checkbox label="News" value={false} onChange={onChange} />);
    const box = screen.getByRole("checkbox", { name: "News" }) as HTMLInputElement;
    fireEvent.click(box);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(box.checked).toBe(false);
    rerender(<Checkbox label="News" value onChange={onChange} />);
    expect(box.checked).toBe(true);
  });

  it("works as a controlled pair in a parent", () => {
    render(<Pair />);
    const box = screen.getByRole("checkbox", { name: "Pair" }) as HTMLInputElement;
    fireEvent.click(box);
    expect(box.checked).toBe(true);
  });

  it("ties the description and the error message to the input", () => {
    render(
      <Checkbox label="Terms" description="Read them first" isInvalid errorMessage="Required" />,
    );
    const box = screen.getByRole("checkbox", { name: "Terms" });
    expect(box.getAttribute("aria-invalid")).toBe("true");
    const described = (box.getAttribute("aria-describedby") ?? "").split(" ");
    expect(described.map((id) => document.getElementById(id)?.textContent)).toEqual(
      expect.arrayContaining(["Read them first", "Required"]),
    );
  });

  it("shows the error message only while the field is invalid", () => {
    const { rerender } = render(<Checkbox label="Terms" errorMessage="Required" />);
    expect(screen.queryByText("Required")).toBeNull();
    rerender(<Checkbox label="Terms" errorMessage="Required" isInvalid />);
    expect(screen.getByText("Required")).toBeTruthy();
  });

  it("marks a required field in the label and for assistive technology", () => {
    const { container } = render(<Checkbox label="Terms" isRequired />);
    expect(screen.getByRole("checkbox", { name: /Terms/ }).hasAttribute("required")).toBe(true);
    expect(container.querySelector('[data-slot="label"]')?.className).toContain("required");
  });

  it("refuses input while disabled and while read-only, but a read-only box keeps focus", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Checkbox label="A" isDisabled onChange={onChange} />);
    const box = screen.getByRole("checkbox", { name: "A" }) as HTMLInputElement;
    expect(box.disabled).toBe(true);
    rerender(<Checkbox label="A" isReadOnly defaultValue onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "A" }));
    expect(onChange).not.toHaveBeenCalled();
    expect((screen.getByRole("checkbox", { name: "A" }) as HTMLInputElement).disabled).toBe(false);
  });

  it("shows the mixed state when indeterminate", () => {
    const { container } = render(<Checkbox label="All" isIndeterminate />);
    expect((screen.getByRole("checkbox", { name: "All" }) as HTMLInputElement).indeterminate).toBe(
      true,
    );
    expect(
      container.querySelector('[data-slot="checkbox-default-indicator--indeterminate"]'),
    ).toBeTruthy();
  });

  it("submits under its name in a form", () => {
    const { container } = render(
      <form>
        <Checkbox label="A" name="agree" defaultValue />
      </form>,
    );
    const data = new FormData(container.querySelector("form") as HTMLFormElement);
    expect(data.has("agree")).toBe(true);
  });

  it("names itself with aria-label when it has no label, and passes unknown props through", () => {
    render(<Checkbox aria-label="Select row" data-testid="row-box" className="mine" />);
    expect(screen.getByRole("checkbox", { name: "Select row" })).toBeTruthy();
    expect(screen.getByTestId("row-box").className).toContain("mine");
  });

  it("passes the variant to HeroUI", () => {
    const { container } = render(<Checkbox label="A" variant="secondary" />);
    expect(container.querySelector('[data-slot="checkbox"]')?.className).toContain(
      "checkbox--secondary",
    );
  });

  it("refuses HeroUI's names for what the contract names", () => {
    // @ts-expect-error `isSelected` is `value`.
    const selected: CheckboxProps = { isSelected: true };
    // @ts-expect-error `defaultSelected` is `defaultValue`.
    const initial: CheckboxProps = { defaultSelected: true };
    // @ts-expect-error `children` is `label`.
    const children: CheckboxProps = { children: "x" };
    expectTypeOf<CheckboxProps["value"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CheckboxProps["onChange"]>().toEqualTypeOf<
      ((value: boolean) => void) | undefined
    >();
    expect([selected, initial, children]).toHaveLength(3);
  });
});
