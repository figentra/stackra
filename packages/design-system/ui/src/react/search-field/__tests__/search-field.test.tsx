/**
 * Stackra file contract:
 * Purpose: proves the web SearchField names its input by its label or `aria-label`, ties the description and the error
 *          message to it, shows the error only while `isInvalid`, controls and clears its text through the clear
 *          button (default or given name), submits on Enter, honours the disabled, read-only, required and loading
 *          states, draws both surfaces and full width, passes unknown props and the ref through, and refuses
 *          HeroUI's `fullWidth`.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-072 sta-350:FR-073
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";

import type { SearchFieldContractProps } from "#contracts/types/search-field-contract-props.type";
import { SearchField } from "#react/search-field/search-field";
import type { SearchFieldProps } from "#react/search-field/search-field.props";

const press = (element: HTMLElement) => act(() => element.click());

describe("SearchField (web)", () => {
  it("names the input by its label and ties the description to it", () => {
    render(<SearchField label="Orders" description="Search by number or customer" />);
    const input = screen.getByRole("searchbox", { name: "Orders" });
    const description = screen.getByText("Search by number or customer");
    expect(input.getAttribute("aria-describedby")).toContain(description.id);
  });

  it("is named by aria-label when there is no visible label", () => {
    render(<SearchField aria-label="Find a product" />);
    expect(screen.getByRole("searchbox", { name: "Find a product" })).toBeTruthy();
  });

  it("shows the error message only while the field is invalid, and ties it to the input", () => {
    const { rerender } = render(<SearchField label="Orders" errorMessage="Too short" />);
    expect(screen.queryByText("Too short")).toBeNull();
    rerender(<SearchField label="Orders" errorMessage="Too short" isInvalid />);
    const input = screen.getByRole("searchbox", { name: "Orders" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toContain(screen.getByText("Too short").id);
  });

  it("puts the placeholder and the form name on the input", () => {
    render(<SearchField label="Orders" placeholder="Order number" name="q" />);
    const input = screen.getByRole("searchbox", { name: "Orders" });
    expect(input.getAttribute("placeholder")).toBe("Order number");
    expect(input.getAttribute("name")).toBe("q");
  });

  it("reports each change with the new text, controlled or not", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SearchField label="Orders" defaultValue="ab" onChange={onChange} />,
    );
    const input = screen.getByRole<HTMLInputElement>("searchbox", { name: "Orders" });
    expect(input.value).toBe("ab");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(onChange).toHaveBeenLastCalledWith("abc");
    expect(input.value).toBe("abc");
    rerender(<SearchField label="Orders" value="fixed" onChange={onChange} />);
    fireEvent.change(input, { target: { value: "other" } });
    expect(onChange).toHaveBeenLastCalledWith("other");
    expect(input.value).toBe("fixed");
  });

  it("clears the text with a clear button named 'Clear search', and says so to onClear", () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<SearchField label="Orders" defaultValue="abc" onChange={onChange} onClear={onClear} />);
    press(screen.getByRole("button", { name: "Clear search" }));
    expect(onChange).toHaveBeenLastCalledWith("");
    expect(onClear).toHaveBeenCalledOnce();
    expect(screen.getByRole<HTMLInputElement>("searchbox", { name: "Orders" }).value).toBe("");
  });

  it("names the clear button by clearLabel when given", () => {
    render(<SearchField label="Orders" defaultValue="abc" clearLabel="Clear the order search" />);
    expect(screen.getByRole("button", { name: "Clear the order search" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });

  it("submits the text on Enter", () => {
    const onSubmit = vi.fn();
    render(<SearchField label="Orders" defaultValue="abc" onSubmit={onSubmit} />);
    fireEvent.keyDown(screen.getByRole("searchbox", { name: "Orders" }), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("abc");
  });

  it("disables the input, makes it read-only and marks it required", () => {
    const { rerender } = render(<SearchField label="Orders" isDisabled />);
    expect(screen.getByRole<HTMLInputElement>("searchbox", { name: "Orders" }).disabled).toBe(true);
    rerender(<SearchField label="Orders" isReadOnly defaultValue="abc" />);
    expect(screen.getByRole<HTMLInputElement>("searchbox", { name: "Orders" }).readOnly).toBe(true);
    rerender(<SearchField label="Orders" isRequired />);
    expect(screen.getByRole<HTMLInputElement>("searchbox").required).toBe(true);
  });

  it("marks the input busy and swaps the icon for a spinner while loading", () => {
    const { container, rerender } = render(<SearchField label="Orders" />);
    const input = screen.getByRole("searchbox", { name: "Orders" });
    expect(input.hasAttribute("aria-busy")).toBe(false);
    expect(container.querySelector(".spinner")).toBeNull();
    rerender(<SearchField label="Orders" isLoading />);
    expect(input.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelectorAll(".spinner")).toHaveLength(1);
    expect(container.querySelector(".spinner")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("draws the primary surface by default, the secondary one and full width as HeroUI's classes", () => {
    const { container, rerender } = render(<SearchField label="Orders" />);
    const root = () => container.querySelector('[data-slot="search-field"]');
    expect(root()?.classList.contains("search-field--primary")).toBe(true);
    expect(root()?.classList.contains("search-field--full-width")).toBe(false);
    rerender(<SearchField label="Orders" variant="secondary" isFullWidth />);
    expect(root()?.classList.contains("search-field--secondary")).toBe(true);
    expect(root()?.classList.contains("search-field--full-width")).toBe(true);
  });

  it("passes unknown props and the ref through to the root", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <SearchField label="Orders" data-testid="orders-search" className="extra" ref={ref} />,
    );
    const root = container.querySelector('[data-slot="search-field"]');
    expect(root?.getAttribute("data-testid")).toBe("orders-search");
    expect(root?.classList.contains("extra")).toBe(true);
    expect(ref.current).toBe(root);
  });

  it("takes the contract's props and refuses HeroUI's own name for full width", () => {
    expectTypeOf<SearchFieldProps>().toExtend<SearchFieldContractProps>();
    expectTypeOf<SearchFieldProps["onChange"]>().toEqualTypeOf<
      ((value: string) => void) | undefined
    >();
    // @ts-expect-error `fullWidth` is `isFullWidth` in the vocabulary
    const refused: SearchFieldProps = { fullWidth: true };
    expect(refused).toBeTruthy();
  });
});
