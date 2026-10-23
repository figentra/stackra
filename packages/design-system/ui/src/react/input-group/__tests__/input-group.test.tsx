/**
 * Stackra file contract:
 * Purpose: proves the web InputGroup draws its prefix before the input and its suffix after it inside one group, names
 *          the input by its label with the description and error tied to it, hands the group the field's invalid and
 *          disabled state, edits a value and reports each change as a string, takes the variant and fills the width by
 *          default, focuses the input when the group is pressed, passes unknown props through, and refuses
 *          `fullWidth` and `children`.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are checked,
 *           not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-069 sta-350:FR-070
import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

import type { InputGroupContractProps } from "#contracts/types/input-group-contract-props.type";
import { InputGroup, type InputGroupProps } from "#react/input-group/input-group";

describe("InputGroup (web)", () => {
  it("draws the prefix, the input and the suffix in that order inside one group", () => {
    const { container } = render(<InputGroup label="Slug" prefix="/" suffix=".html" />);
    const group = container.querySelector('[data-slot="input-group"]');
    expect([...(group?.children ?? [])].map((node) => node.getAttribute("data-slot"))).toEqual([
      "input-group-prefix",
      "input-group-input",
      "input-group-suffix",
    ]);
    expect(group?.textContent).toBe("/.html");
  });

  it("draws only the affixes it is given", () => {
    const { container } = render(<InputGroup aria-label="Plain" />);
    expect(container.querySelector('[data-slot="input-group-prefix"]')).toBeNull();
    expect(container.querySelector('[data-slot="input-group-suffix"]')).toBeNull();
    expect(screen.getByRole("textbox", { name: "Plain" })).toBeTruthy();
  });

  it("names the input by its label and ties the description to it", () => {
    render(<InputGroup label="Price" description="Before tax" suffix="USD" />);
    const input = screen.getByRole("textbox", { name: "Price" });
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(
      screen.getByText("Before tax").id,
    );
  });

  it("shows the error message only while invalid and gives the group the invalid state", () => {
    const { container, rerender } = render(
      <InputGroup label="Price" errorMessage="Enter a price" suffix="USD" />,
    );
    expect(screen.queryByText("Enter a price")).toBeNull();
    expect(container.querySelector('[data-slot="input-group"]')?.getAttribute("data-invalid")).toBe(
      null,
    );
    rerender(<InputGroup label="Price" errorMessage="Enter a price" suffix="USD" isInvalid />);
    const input = screen.getByRole("textbox", { name: "Price" });
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(
      screen.getByText("Enter a price").id,
    );
    expect(container.querySelector('[data-slot="input-group"]')?.getAttribute("data-invalid")).toBe(
      "true",
    );
  });

  it("gives the group the disabled state and keeps the required and read-only states", () => {
    const { container, rerender } = render(<InputGroup label="Price" isDisabled />);
    expect(screen.getByRole("textbox", { name: "Price" }).hasAttribute("disabled")).toBe(true);
    expect(
      container.querySelector('[data-slot="input-group"]')?.getAttribute("data-disabled"),
    ).toBe("true");
    rerender(<InputGroup label="Price" isRequired isReadOnly value="1" />);
    const input = screen.getByRole("textbox", { name: /Price/ });
    expect(input.hasAttribute("required")).toBe(true);
    expect(input.hasAttribute("readonly")).toBe(true);
  });

  it("reports each change as a string and submits under its name", () => {
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <InputGroup label="Price" name="price" defaultValue="1" suffix="USD" onChange={onChange} />
      </form>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Price" }), { target: { value: "12" } });
    expect(onChange).toHaveBeenCalledWith("12");
    expect(new FormData(container.querySelector("form") as HTMLFormElement).get("price")).toBe(
      "12",
    );
  });

  it("focuses the input when a text affix is pressed", () => {
    render(<InputGroup label="Price" prefix="$" />);
    fireEvent.click(screen.getByText("$"));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Price" }));
  });

  it("leaves focus where it is when an element affix is pressed", () => {
    const onPress = vi.fn();
    render(
      <InputGroup
        label="Password"
        suffix={
          <button type="button" onClick={onPress}>
            Show
          </button>
        }
      />,
    );
    const button = screen.getByRole("button", { name: "Show" });
    button.focus();
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(button);
  });

  it("is a primary, full-width field by default and takes the secondary variant", () => {
    const { container, rerender } = render(<InputGroup label="Price" suffix="USD" />);
    const group = () => container.querySelector('[data-slot="input-group"]');
    expect(group()?.classList.contains("input-group--full-width")).toBe(true);
    expect(group()?.classList.contains("input-group--primary")).toBe(true);
    rerender(<InputGroup label="Price" suffix="USD" isFullWidth={false} variant="secondary" />);
    expect(group()?.classList.contains("input-group--full-width")).toBe(false);
    expect(group()?.classList.contains("input-group--secondary")).toBe(true);
  });

  it("passes unknown props through to HeroUI's root and keeps the caller's class", () => {
    const { container } = render(
      <InputGroup label="Price" className="mine" type="url" data-testid="root" />,
    );
    expect(screen.getByTestId("root").classList.contains("mine")).toBe(true);
    expect(container.querySelector("input")?.getAttribute("type")).toBe("url");
  });

  it("matches the shared contract and refuses `fullWidth` and `children`", () => {
    expectTypeOf<InputGroupProps>().toExtend<InputGroupContractProps>();
    // @ts-expect-error `fullWidth` is `isFullWidth` in the contract
    createElement(InputGroup, { fullWidth: true });
    // @ts-expect-error the field draws its own parts
    const withChildren: InputGroupProps = { children: "x" };
    void withChildren;
  });
});
