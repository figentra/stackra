/**
 * Stackra file contract:
 * Purpose: proves the web TransferList splits the items into the available and chosen lists with counts, moves ticked
 *          items both ways in item order and announces it, moves all the filter shows, filters each list, leaves a
 *          disabled item in place and submits the chosen keys under `name`.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { TransferList } from "#react/transfer-list/transfer-list";

const ITEMS = [
  { id: "riyadh", label: "Riyadh warehouse" },
  { id: "jeddah", label: "Jeddah warehouse" },
  { id: "dammam", label: "Dammam warehouse", isDisabled: true },
  { id: "dubai", label: "Dubai hub" },
];

const list = (name: string) => screen.getByRole("listbox", { name });
const press = (element: HTMLElement) => act(() => element.click());
const tick = (listName: string, name: string) =>
  press(within(list(listName)).getByRole("option", { name }));

describe("TransferList (web)", () => {
  it("splits items into two lists with counts", () => {
    render(<TransferList label="Stock locations" items={ITEMS} defaultValue={["dubai"]} />);
    expect(within(list("Available")).getAllByRole("option")).toHaveLength(3);
    expect(within(list("Chosen")).getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Chosen 1" })).toBeTruthy();
  });

  it("moves ticked items both ways, in item order, and announces it", () => {
    const onChange = vi.fn();
    render(<TransferList items={ITEMS} defaultValue={["dubai"]} onChange={onChange} />);
    const add = screen.getByRole("button", { name: "Add the ticked items" });
    expect(add.hasAttribute("disabled") || add.getAttribute("aria-disabled") === "true").toBe(true);
    tick("Available", "Riyadh warehouse");
    press(screen.getByRole("button", { name: "Add the ticked items" }));
    expect(onChange).toHaveBeenLastCalledWith(["riyadh", "dubai"]);
    expect(screen.getByRole("status").textContent).toBe("1 item moved");
    tick("Chosen", "Dubai hub");
    press(screen.getByRole("button", { name: "Remove the ticked items" }));
    expect(onChange).toHaveBeenLastCalledWith(["riyadh"]);
  });

  it("filters a list and moves all it shows, never a disabled item", () => {
    const onChange = vi.fn();
    render(<TransferList items={ITEMS} onChange={onChange} />);
    act(() => {
      fireEvent.change(screen.getByRole("searchbox", { name: "Filter Available" }), {
        target: { value: "warehouse" },
      });
    });
    expect(within(list("Available")).getAllByRole("option")).toHaveLength(3);
    press(screen.getByRole("button", { name: "Add all" }));
    expect(onChange).toHaveBeenLastCalledWith(["riyadh", "jeddah"]);
  });

  it("submits the chosen keys", () => {
    const { container } = render(
      <TransferList items={ITEMS} defaultValue={["jeddah", "dubai"]} name="locations" />,
    );
    const inputs = [...container.querySelectorAll<HTMLInputElement>('input[name="locations"]')];
    expect(inputs.map((input) => input.value)).toEqual(["jeddah", "dubai"]);
  });
});
