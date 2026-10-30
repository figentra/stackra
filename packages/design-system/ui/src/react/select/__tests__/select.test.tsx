/**
 * Stackra file contract:
 * Purpose: proves the web Select names its trigger by its label or `aria-label`, ties the description and the error
 *          message to it, shows the error only while `isInvalid`, lists the items as options with their descriptions
 *          and disabled ones, reports the chosen key as a string and shows its label alone, runs controlled with `null`
 *          for nothing, never opens while read-only, honours the disabled, required and full-width states, passes
 *          unknown props and the ref through, and refuses HeroUI's `fullWidth` and children.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-075 sta-350:FR-076
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createRef } from "react";

import type { SelectContractProps } from "#contracts/types/select-contract-props.type";
import { Select } from "#react/select/select";
import type { SelectProps } from "#react/select/select.props";

const press = (element: HTMLElement) => act(() => element.click());

const ITEMS = [
  { id: "draft", label: "Draft", description: "Not sent yet" },
  { id: "sent", label: "Sent" },
  { id: "void", label: "Void", isDisabled: true },
] as const;

describe("Select (web)", () => {
  it("names the trigger by its label and ties the description to it", () => {
    render(<Select items={ITEMS} label="Status" description="Where the order stands" />);
    const trigger = screen.getByRole("button", { name: /Status/ });
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger.getAttribute("aria-describedby")).toContain(
      screen.getByText("Where the order stands").id,
    );
  });

  it("is named by aria-label when there is no visible label", () => {
    render(<Select items={ITEMS} aria-label="Order status" />);
    expect(screen.getByRole("button", { name: /Order status/ })).toBeTruthy();
  });

  it("shows the placeholder until a key is chosen", () => {
    const { container } = render(<Select items={ITEMS} label="Status" placeholder="Pick one" />);
    expect(container.querySelector('[data-slot="select-value"]')?.textContent).toBe("Pick one");
  });

  it("shows the error message only while the field is invalid, and ties it to the trigger", () => {
    const { rerender } = render(<Select items={ITEMS} label="Status" errorMessage="Choose one" />);
    expect(screen.queryByText("Choose one")).toBeNull();
    rerender(<Select items={ITEMS} label="Status" errorMessage="Choose one" isInvalid />);
    const trigger = screen.getByRole("button", { name: /Status/ });
    expect(trigger.getAttribute("aria-describedby")).toContain(screen.getByText("Choose one").id);
  });

  it("lists the items as options, with descriptions and disabled ones", () => {
    render(<Select items={ITEMS} label="Status" />);
    press(screen.getByRole("button", { name: /Status/ }));
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.map((option) => option.getAttribute("data-key"))).toEqual([
      "draft",
      "sent",
      "void",
    ]);
    expect(options[0]?.textContent).toContain("Not sent yet");
    expect(options[2]?.getAttribute("aria-disabled")).toBe("true");
  });

  it("groups choices that name a section under a header that names the group, and none can pick a header", () => {
    const onChange = vi.fn();
    render(
      <Select
        label="City"
        onChange={onChange}
        items={[
          { id: "cairo", label: "Cairo", section: "Africa" },
          { id: "paris", label: "Paris", section: "Europe" },
          { id: "lagos", label: "Lagos", section: "Africa" },
        ]}
      />,
    );
    press(screen.getByRole("button", { name: /City/ }));
    const groups = within(screen.getByRole("listbox")).getAllByRole("group");
    expect(groups.map((group) => group.getAttribute("aria-labelledby") !== null)).toEqual([
      true,
      true,
    ]);
    expect(within(groups[0] as HTMLElement).getByText("Africa")).toBeTruthy();
    expect(
      within(groups[0] as HTMLElement)
        .getAllByRole("option")
        .map((option) => option.getAttribute("data-key")),
    ).toEqual(["cairo", "lagos"]);
    expect(screen.getByRole("group", { name: "Europe" })).toBe(groups[1]);
    press(screen.getByText("Africa"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reports the chosen key as a string and shows its label alone", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Select items={ITEMS} label="Status" defaultValue="sent" onChange={onChange} />,
    );
    const value = () => container.querySelector('[data-slot="select-value"]')?.textContent;
    expect(value()).toBe("Sent");
    press(screen.getByRole("button", { name: /Status/ }));
    press(screen.getByRole("option", { name: /Draft/ }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("draft");
    // The field shows the label, not the option's description or check mark.
    expect(value()).toBe("Draft");
  });

  it("follows `value` when controlled, `null` meaning nothing chosen", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <Select
        items={ITEMS}
        label="Status"
        placeholder="Pick one"
        value="sent"
        onChange={onChange}
      />,
    );
    const value = () => container.querySelector('[data-slot="select-value"]')?.textContent;
    expect(value()).toBe("Sent");
    press(screen.getByRole("button", { name: /Status/ }));
    press(screen.getByRole("option", { name: /Draft/ }));
    expect(onChange).toHaveBeenLastCalledWith("draft");
    expect(value()).toBe("Sent");
    rerender(
      <Select
        items={ITEMS}
        label="Status"
        placeholder="Pick one"
        value={null}
        onChange={onChange}
      />,
    );
    expect(value()).toBe("Pick one");
  });

  it("submits the chosen key under its name", () => {
    const { container } = render(
      <Select items={ITEMS} label="Status" name="status" defaultValue="sent" />,
    );
    expect(container.querySelector<HTMLSelectElement>("select[name=status]")?.value).toBe("sent");
  });

  it("never opens while read-only, and keeps its value", () => {
    const { container } = render(
      <Select items={ITEMS} label="Status" defaultValue="sent" isReadOnly />,
    );
    press(screen.getByRole("button", { name: /Status/ }));
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(container.querySelector('[data-slot="select-value"]')?.textContent).toBe("Sent");
  });

  it("refuses the arrow keys and type-ahead while read-only", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Select items={ITEMS} label="Status" defaultValue="sent" isReadOnly onChange={onChange} />,
    );
    const trigger = screen.getByRole("button", { name: /Status/ });
    fireEvent.keyDown(trigger, { key: "ArrowLeft" });
    fireEvent.keyDown(trigger, { key: "ArrowRight" });
    fireEvent.keyDown(trigger, { key: "D" });
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector('[data-slot="select-value"]')?.textContent).toBe("Sent");
  });

  it("refuses a press while disabled and marks a required field", () => {
    const { rerender } = render(<Select items={ITEMS} label="Status" isDisabled />);
    const trigger = screen.getByRole<HTMLButtonElement>("button", { name: /Status/ });
    expect(trigger.disabled).toBe(true);
    rerender(<Select items={ITEMS} label="Status" isRequired />);
    expect(document.querySelector('[data-slot="select"]')?.getAttribute("data-required")).toBe(
      "true",
    );
  });

  it("fills its parent only when asked", () => {
    const { container, rerender } = render(<Select items={ITEMS} label="Status" />);
    const root = () => container.querySelector('[data-slot="select"]');
    expect(root()?.classList.contains("select--full-width")).toBe(false);
    rerender(<Select items={ITEMS} label="Status" isFullWidth />);
    expect(root()?.classList.contains("select--full-width")).toBe(true);
  });

  it("passes unknown props and the ref through", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Select
        ref={ref}
        items={ITEMS}
        label="Status"
        data-testid="field"
        className="mine"
        variant="secondary"
      />,
    );
    const root = container.querySelector('[data-slot="select"]');
    expect(root?.getAttribute("data-testid")).toBe("field");
    expect(root?.classList.contains("mine")).toBe(true);
    expect(root?.classList.contains("select--secondary")).toBe(true);
    expect(ref.current).toBe(root);
  });

  it("types: extends the contract and refuses `fullWidth`, children and a missing list", () => {
    expectTypeOf<SelectProps>().toExtend<SelectContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error the width is `isFullWidth`
    void (<Select items={ITEMS} fullWidth />);
    // @ts-expect-error choices are `items`, never children
    void (<Select items={ITEMS}>x</Select>);
    // @ts-expect-error a select needs its choices
    void (<Select />);
  });
});
