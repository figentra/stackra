/**
 * Stackra file contract:
 * Purpose: proves the web Accordion draws one heading button per item with its content in a panel only while it is
 *          expanded, opens one section at a time unless `canExpandMultiple`, reports the open sections as a list of ids
 *          in the items' order (controlled or not), refuses a disabled section and a disabled accordion from the
 *          pointer and the keyboard, draws HeroUI's surface variant only when asked, passes unknown props and the ref
 *          through, and refuses HeroUI's `allowsMultipleExpanded`, children and a selection.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0313; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-137
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";

import type { AccordionContractProps } from "#contracts/types/accordion-contract-props.type";
import { Accordion, type AccordionProps } from "#react/accordion/accordion";

const ITEMS = [
  { id: "shipping", title: "Shipping", content: "Ships in two days" },
  { id: "returns", title: "Returns", content: "Free for thirty days" },
  { id: "warranty", title: "Warranty", content: "Two years", isDisabled: true },
  { id: "care", title: "Care", content: "Hand wash only" },
] as const;

const press = (element: HTMLElement) => act(() => element.click());
const button = (name: string) => screen.getByRole("button", { name });
const expanded = () =>
  screen
    .getAllByRole("button")
    .filter((each) => each.getAttribute("aria-expanded") === "true")
    .map((each) => each.textContent);

describe("Accordion (web)", () => {
  it("draws one heading button per item, collapsed, with no panel in the page", () => {
    render(<Accordion items={ITEMS} />);
    expect(screen.getAllByRole("heading")).toHaveLength(4);
    expect(screen.getAllByRole("button").map((each) => each.textContent)).toEqual([
      "Shipping",
      "Returns",
      "Warranty",
      "Care",
    ]);
    expect(expanded()).toEqual([]);
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("shows a section's content in a panel named by its title only while it is expanded", () => {
    render(<Accordion items={ITEMS} />);
    press(button("Shipping"));
    expect(expanded()).toEqual(["Shipping"]);
    expect(screen.getByRole("group", { name: "Shipping" }).textContent).toBe("Ships in two days");
    press(button("Shipping"));
    expect(expanded()).toEqual([]);
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("opens one section at a time by default, and reports the open ids as a list", () => {
    const onExpandedChange = vi.fn();
    render(<Accordion items={ITEMS} onExpandedChange={onExpandedChange} />);
    press(button("Shipping"));
    expect(onExpandedChange).toHaveBeenLastCalledWith(["shipping"]);
    press(button("Returns"));
    expect(onExpandedChange).toHaveBeenLastCalledWith(["returns"]);
    expect(expanded()).toEqual(["Returns"]);
  });

  it("keeps several open with `canExpandMultiple`, reporting them in the items' order", () => {
    const onExpandedChange = vi.fn();
    render(<Accordion items={ITEMS} canExpandMultiple onExpandedChange={onExpandedChange} />);
    press(button("Care"));
    press(button("Shipping"));
    expect(onExpandedChange).toHaveBeenLastCalledWith(["shipping", "care"]);
    expect(expanded()).toEqual(["Shipping", "Care"]);
    press(button("Care"));
    expect(onExpandedChange).toHaveBeenLastCalledWith(["shipping"]);
  });

  it("starts from `defaultExpandedKeys`", () => {
    render(<Accordion items={ITEMS} defaultExpandedKeys={["returns"]} />);
    expect(expanded()).toEqual(["Returns"]);
  });

  it("follows `expandedKeys` when controlled", () => {
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <Accordion items={ITEMS} expandedKeys={["shipping"]} onExpandedChange={onExpandedChange} />,
    );
    press(button("Returns"));
    expect(onExpandedChange).toHaveBeenLastCalledWith(["returns"]);
    expect(expanded()).toEqual(["Shipping"]);
    rerender(
      <Accordion items={ITEMS} expandedKeys={["returns"]} onExpandedChange={onExpandedChange} />,
    );
    expect(expanded()).toEqual(["Returns"]);
  });

  it("opens with Enter and Space from the keyboard", () => {
    render(<Accordion items={ITEMS} canExpandMultiple />);
    fireEvent.keyDown(button("Shipping"), { key: "Enter" });
    fireEvent.keyUp(button("Shipping"), { key: "Enter" });
    fireEvent.keyDown(button("Returns"), { key: " " });
    fireEvent.keyUp(button("Returns"), { key: " " });
    expect(expanded()).toEqual(["Shipping", "Returns"]);
  });

  it("refuses a disabled section from the pointer and the keyboard", () => {
    const onExpandedChange = vi.fn();
    render(<Accordion items={ITEMS} onExpandedChange={onExpandedChange} />);
    expect(button("Warranty").hasAttribute("disabled")).toBe(true);
    press(button("Warranty"));
    fireEvent.keyDown(button("Warranty"), { key: "Enter" });
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(expanded()).toEqual([]);
  });

  it("refuses every section while disabled, keeping the open ones open", () => {
    const onExpandedChange = vi.fn();
    render(
      <Accordion
        items={ITEMS}
        isDisabled
        defaultExpandedKeys={["shipping"]}
        onExpandedChange={onExpandedChange}
      />,
    );
    for (const each of screen.getAllByRole("button")) {
      expect(each.hasAttribute("disabled")).toBe(true);
    }
    press(button("Returns"));
    press(button("Shipping"));
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(expanded()).toEqual(["Shipping"]);
  });

  it("draws HeroUI's surface variant only when asked", () => {
    const { container, rerender } = render(<Accordion items={ITEMS} />);
    const root = () => container.querySelector('[data-slot="accordion"]');
    expect(root()?.classList.contains("accordion--surface")).toBe(false);
    rerender(<Accordion items={ITEMS} variant="surface" />);
    expect(root()?.classList.contains("accordion--surface")).toBe(true);
  });

  it("passes unknown props and the ref through", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Accordion ref={ref} items={ITEMS} data-testid="accordion" className="mine" />,
    );
    const root = container.querySelector('[data-slot="accordion"]');
    expect(root?.getAttribute("data-testid")).toBe("accordion");
    expect(root?.classList.contains("mine")).toBe(true);
    expect(ref.current).toBe(root);
  });

  it("types: extends the contract and refuses HeroUI's names for expansion, children and a selection", () => {
    expectTypeOf<AccordionProps>().toExtend<AccordionContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error several open is `canExpandMultiple`
    void (<Accordion items={ITEMS} allowsMultipleExpanded />);
    // @ts-expect-error sections are `items`, never children
    void (<Accordion items={ITEMS}>x</Accordion>);
    // @ts-expect-error expansion is not selection
    void (<Accordion items={ITEMS} selectionMode="single" />);
  });
});
