/**
 * Stackra file contract:
 * Purpose: proves the web CheckboxGroup is a named group with one checkbox per option, reports the list of chosen
 *          keys through `value`, `defaultValue` and `onChange` (the field contract), applies group and option
 *          disabled states, ties the group's description and error message to it, and refuses `children`.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so attributes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-082 sta-350:FR-083 sta-350:FR-084 sta-350:FR-086 sta-350:FR-087
import { fireEvent, render, screen } from "@testing-library/react";

import type { ChoiceOption } from "#contracts/types/choice-option.type";
import { CheckboxGroup } from "#react/checkbox-group/checkbox-group";
import type { CheckboxGroupProps } from "#react/checkbox-group/checkbox-group.props";

const OPTIONS: readonly ChoiceOption[] = [
  { value: "email", label: "Email", description: "Weekly digest" },
  { value: "sms", label: "SMS" },
  { value: "push", label: "Push", isDisabled: true },
];

describe("CheckboxGroup (web)", () => {
  it("is a group named by its label with one checkbox per option, in order", () => {
    render(<CheckboxGroup label="Channels" options={OPTIONS} />);
    const group = screen.getByRole("group", { name: "Channels" });
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes.map((box) => box.getAttribute("value"))).toEqual(["email", "sms", "push"]);
    expect(boxes.every((box) => group.contains(box))).toBe(true);
    expect(screen.getByRole("checkbox", { name: "Email" })).toBeTruthy();
  });

  it("starts from defaultValue and reports the list of chosen keys on each change", () => {
    const onChange = vi.fn();
    render(
      <CheckboxGroup
        label="Channels"
        options={OPTIONS}
        defaultValue={["sms"]}
        onChange={onChange}
      />,
    );
    expect((screen.getByRole("checkbox", { name: "SMS" }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: "Email" }));
    expect(onChange).toHaveBeenLastCalledWith(["sms", "email"]);
    fireEvent.click(screen.getByRole("checkbox", { name: "SMS" }));
    expect(onChange).toHaveBeenLastCalledWith(["email"]);
  });

  it("is controlled by value", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CheckboxGroup label="Channels" options={OPTIONS} value={["email"]} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "SMS" }));
    expect(onChange).toHaveBeenLastCalledWith(["email", "sms"]);
    expect((screen.getByRole("checkbox", { name: "SMS" }) as HTMLInputElement).checked).toBe(false);
    rerender(<CheckboxGroup label="Channels" options={OPTIONS} value={["email", "sms"]} />);
    expect((screen.getByRole("checkbox", { name: "SMS" }) as HTMLInputElement).checked).toBe(true);
  });

  it("disables one option on its own, or every option with the group", () => {
    const { rerender } = render(<CheckboxGroup label="Channels" options={OPTIONS} />);
    expect((screen.getByRole("checkbox", { name: "Push" }) as HTMLInputElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole("checkbox", { name: "SMS" }) as HTMLInputElement).disabled).toBe(
      false,
    );
    rerender(<CheckboxGroup label="Channels" options={OPTIONS} isDisabled />);
    for (const box of screen.getAllByRole("checkbox"))
      expect((box as HTMLInputElement).disabled).toBe(true);
  });

  it("refuses input from every option while read-only", () => {
    const onChange = vi.fn();
    render(<CheckboxGroup label="Channels" options={OPTIONS} isReadOnly onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "SMS" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reads each option's description with that option", () => {
    render(<CheckboxGroup label="Channels" options={OPTIONS} />);
    const box = screen.getByRole("checkbox", { name: "Email" });
    const described = (box.getAttribute("aria-describedby") ?? "").split(" ");
    expect(described.map((id) => document.getElementById(id)?.textContent)).toContain(
      "Weekly digest",
    );
  });

  it("ties the group's description and error message to the group", () => {
    render(
      <CheckboxGroup
        label="Channels"
        options={OPTIONS}
        description="Pick at least one"
        isInvalid
        errorMessage="Choose a channel"
      />,
    );
    const group = screen.getByRole("group", { name: "Channels" });
    const described = (group.getAttribute("aria-describedby") ?? "").split(" ");
    expect(described.map((id) => document.getElementById(id)?.textContent)).toEqual(
      expect.arrayContaining(["Pick at least one", "Choose a channel"]),
    );
  });

  it("submits each chosen key under the group's name", () => {
    const { container } = render(
      <form>
        <CheckboxGroup
          label="Channels"
          options={OPTIONS}
          name="channels"
          defaultValue={["email", "sms"]}
        />
      </form>,
    );
    const data = new FormData(container.querySelector("form") as HTMLFormElement);
    expect(data.getAll("channels")).toEqual(["email", "sms"]);
  });

  it("names itself with aria-label when it has no label, and passes unknown props through", () => {
    render(<CheckboxGroup aria-label="Pick" data-testid="group" options={OPTIONS} />);
    expect(screen.getByRole("group", { name: "Pick" })).toBe(screen.getByTestId("group"));
  });

  it("refuses children, which the options replace", () => {
    // @ts-expect-error `children` is `options`.
    const children: CheckboxGroupProps = { options: [], children: "x" };
    expectTypeOf<CheckboxGroupProps["value"]>().toEqualTypeOf<readonly string[] | undefined>();
    expect(children).toBeTruthy();
  });
  it("lays the options out in columns under the label, never the label or the error in a cell", () => {
    const { container } = render(
      <CheckboxGroup
        label="Channels"
        options={OPTIONS}
        columns={2}
        errorMessage="Pick one"
        isInvalid
      />,
    );
    const grid = container.querySelector('[data-slot="checkbox-group-columns"]') as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(2, minmax(0, 1fr))");
    expect(grid.querySelectorAll('input[type="checkbox"]')).toHaveLength(OPTIONS.length);
    expect(grid.textContent).not.toContain("Channels");
    expect(grid.textContent).not.toContain("Pick one");
  });
});
