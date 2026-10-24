/**
 * Stackra file contract:
 * Purpose: proves the web PropertyList is a description list with a `dt` and a `dd` for each row in the items' order,
 *          shows the empty value for a missing, empty or `false` value but not for `0`, draws one or two columns, gives a
 *          copy button only to a row with a name and text, writes the clipboard, swaps the icon for a check and speaks
 *          the copied label, stays silent when the clipboard refuses, calls `onCopy`, passes `dl` props through, and
 *          refuses `children` in its type.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles, elements and classes are
 *           checked, not looks. The clipboard is a stand-in on `navigator`, and the check's two seconds run on fake
 *           timers.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decisions 1 and 7); ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-131 sta-350:FR-132
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { PropertyListContractProps } from "#contracts/types/property-list-contract-props.type";
import type { PropertyListItem } from "#contracts/types/property-list-item.type";
import { PropertyList, type PropertyListProps } from "#react/property-list/property-list";

const ITEMS: readonly PropertyListItem[] = [
  { id: "customer", label: "Customer", value: "Ada Lovelace" },
  { id: "order", label: "Order id", value: "ord_01H2", copyLabel: "Copy order id" },
  { id: "note", label: "Note", value: "" },
  { id: "count", label: "Items", value: 0 },
];

/** The `dd` that follows the `dt` carrying a label. */
const valueOf = (label: string) => {
  const term = screen.getByText(label).closest("dt");
  const definition = term?.nextElementSibling;
  if (!definition) throw new Error(`no value for ${label}`);
  return definition as HTMLElement;
};

describe("PropertyList (web)", () => {
  it("is a description list with a term and a definition for each row, in order", () => {
    const { container } = render(<PropertyList items={ITEMS} />);
    const list = container.querySelector("dl");
    expect(list).toBeTruthy();
    expect([...(list?.querySelectorAll("dt") ?? [])].map((term) => term.textContent)).toEqual([
      "Customer",
      "Order id",
      "Note",
      "Items",
    ]);
    expect(valueOf("Customer").textContent).toBe("Ada Lovelace");
  });

  it("shows the empty value for a missing, empty or false value, and not for zero", () => {
    render(
      <PropertyList
        items={[
          { id: "a", label: "Missing" },
          { id: "b", label: "Empty", value: "" },
          { id: "c", label: "False", value: false },
          { id: "d", label: "Zero", value: 0 },
        ]}
      />,
    );
    for (const label of ["Missing", "Empty", "False"]) expect(valueOf(label).textContent).toBe("–");
    expect(valueOf("Zero").textContent).toBe("0");
  });

  it("shows the caller's empty value", () => {
    render(<PropertyList items={[{ id: "a", label: "Note" }]} emptyValue="Not set" />);
    expect(valueOf("Note").textContent).toBe("Not set");
  });

  it("draws a value that is a node as given", () => {
    render(<PropertyList items={[{ id: "a", label: "Owner", value: <a href="/ada">Ada</a> }]} />);
    expect(within(valueOf("Owner")).getByRole("link", { name: "Ada" })).toBeTruthy();
  });

  it("draws one column by default and two on a wide screen when asked", () => {
    const { container, rerender } = render(<PropertyList items={ITEMS} />);
    expect(container.querySelector("dl")?.classList.contains("grid-cols-1")).toBe(true);
    expect(container.querySelector("dl")?.classList.contains("sm:grid-cols-2")).toBe(false);
    rerender(<PropertyList items={ITEMS} columns={2} />);
    expect(container.querySelector("dl")?.classList.contains("sm:grid-cols-2")).toBe(true);
  });

  it("gives a copy button only to a row with a name and text to copy", () => {
    render(
      <PropertyList
        items={[
          { id: "a", label: "Named", value: "x", copyLabel: "Copy named" },
          { id: "b", label: "Unnamed", value: "y" },
          { id: "c", label: "Textless", value: <b>z</b>, copyLabel: "Copy textless" },
          { id: "d", label: "Valued", value: <b>z</b>, copyLabel: "Copy valued", copyValue: "z" },
        ]}
      />,
    );
    expect(
      screen.getAllByRole("button").map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Copy named", "Copy valued"]);
  });

  describe("copying", () => {
    const writeText = vi.fn();

    beforeEach(() => {
      vi.useFakeTimers();
      writeText.mockReset();
      writeText.mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    });

    afterEach(() => {
      vi.useRealTimers();
      Reflect.deleteProperty(navigator, "clipboard");
    });

    it("writes the clipboard, calls onCopy, shows a check for two seconds and says the copied label", async () => {
      const onCopy = vi.fn();
      render(<PropertyList items={ITEMS} onCopy={onCopy} copiedLabel="Copied" />);
      const button = screen.getByRole("button", { name: "Copy order id" });
      expect(button.querySelector("svg.lucide-copy")).toBeTruthy();
      expect(screen.getByRole("status").textContent).toBe("");

      fireEvent.click(button);
      await act(() => vi.advanceTimersByTimeAsync(0));

      expect(writeText).toHaveBeenCalledExactlyOnceWith("ord_01H2");
      expect(onCopy).toHaveBeenCalledExactlyOnceWith(ITEMS[1], "ord_01H2");
      expect(button.querySelector("svg.lucide-check")).toBeTruthy();
      expect(screen.getByRole("status").textContent).toBe("Copied");

      await act(() => vi.advanceTimersByTimeAsync(2000));
      expect(button.querySelector("svg.lucide-copy")).toBeTruthy();
      expect(screen.getByRole("status").textContent).toBe("");
    });

    it("says a default copied word without a copied label, so a copy is never silent", async () => {
      render(<PropertyList items={ITEMS} />);
      expect(screen.getByRole("status").textContent).toBe("");
      fireEvent.click(screen.getByRole("button", { name: "Copy order id" }));
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(screen.getByRole("status").textContent).toBe("Copied");
    });

    it("copies the copy value, not the shown value, when there is one", async () => {
      render(
        <PropertyList
          items={[
            { id: "a", label: "Order", value: "#1", copyLabel: "Copy order", copyValue: "ord_01" },
          ]}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Copy order" }));
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(writeText).toHaveBeenCalledExactlyOnceWith("ord_01");
    });

    it("stays silent when the clipboard refuses: no check, no announcement, no onCopy", async () => {
      writeText.mockRejectedValue(new Error("denied"));
      const onCopy = vi.fn();
      render(<PropertyList items={ITEMS} onCopy={onCopy} copiedLabel="Copied" />);
      const button = screen.getByRole("button", { name: "Copy order id" });
      fireEvent.click(button);
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(onCopy).not.toHaveBeenCalled();
      expect(button.querySelector("svg.lucide-copy")).toBeTruthy();
      expect(screen.getByRole("status").textContent).toBe("");
    });

    it("stays silent on a page with no clipboard at all", async () => {
      Reflect.deleteProperty(navigator, "clipboard");
      const onCopy = vi.fn();
      render(<PropertyList items={ITEMS} onCopy={onCopy} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy order id" }));
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(onCopy).not.toHaveBeenCalled();
    });
  });

  it("merges the caller's class and passes the attributes of a dl through", () => {
    const { container } = render(
      <PropertyList items={ITEMS} className="mine" id="details" aria-label="Order details" />,
    );
    const list = container.querySelector("dl");
    expect(list?.classList.contains("mine")).toBe(true);
    expect(list?.classList.contains("grid")).toBe(true);
    expect(list?.id).toBe("details");
    expect(list?.getAttribute("aria-label")).toBe("Order details");
  });

  it("types: extends the contract and takes no children", () => {
    expectTypeOf<PropertyListProps>().toExtend<PropertyListContractProps>();
    // @ts-expect-error the rows come from `items`, not from children
    void (<PropertyList items={ITEMS}>row</PropertyList>);
    // @ts-expect-error a list without items draws nothing
    void (<PropertyList />);
    // @ts-expect-error two columns at most
    void (<PropertyList items={ITEMS} columns={3} />);
  });
});
