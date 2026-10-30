/**
 * Stackra file contract:
 * Purpose: proves the web MultiSelect lists every option, narrows them by the typed text in any case and accent, adds a
 *          pick as a chip and clears the text, removes a chip by its button (named by the caller), reports the ids
 *          whether controlled or not, shows the empty message, draws no remove buttons when read-only, and refuses
 *          `selectionMode` and `inputValue`.
 * Boundary: jsdom with real HeroUI, React Aria and motion; looks are not checked.
 * Runtime: browser
 * Governing contract: gap inventory row 4; ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

import type { MultiSelectContractProps } from "#contracts/types/multi-select-contract-props.type";
import { MultiSelect } from "#react/multi-select/multi-select";
import type { MultiSelectProps } from "#react/multi-select/multi-select.props";

const ITEMS = [
  { id: "dine-in", label: "Dine in" },
  { id: "takeaway", label: "Takeaway" },
  { id: "delivery", label: "Délivery" },
] as const;
const remove = (label: string) => `Remove ${label}`;
const input = () => screen.getByRole("combobox") as HTMLInputElement;
/** Types the way a person does: focus first, which is what lets the list open. */
const type = (text: string) => {
  act(() => input().focus());
  fireEvent.change(input(), { target: { value: text } });
};
const open = () => act(() => screen.getByRole("button", { name: /Channels/ }).click());

describe("MultiSelect (web)", () => {
  it("lists every option and narrows them by the typed text, ignoring case and accents", () => {
    render(<MultiSelect label="Channels" items={ITEMS} removeLabel={remove} emptyMessage="None" />);
    type("deliv");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Délivery"]);
    type("zzz");
    // React Aria wraps the empty state in an option of its own, which carries no key.
    expect(
      screen.queryAllByRole("option").filter((option) => option.hasAttribute("data-key")),
    ).toHaveLength(0);
    expect(screen.getByText("None")).toBeTruthy();
  });

  it("adds a pick as a chip, clears the text and reports the ids", () => {
    const onChange = vi.fn();
    render(<MultiSelect label="Channels" items={ITEMS} removeLabel={remove} onChange={onChange} />);
    type("take");
    act(() => screen.getByRole("option", { name: "Takeaway" }).click());
    expect(onChange).toHaveBeenLastCalledWith(["takeaway"]);
    expect(input().value).toBe("");
    expect(document.querySelector('[data-slot="tag"]')?.getAttribute("data-key")).toBe("takeaway");
  });

  it("removes a chip by its named button", () => {
    const onChange = vi.fn();
    render(
      <MultiSelect
        label="Channels"
        items={ITEMS}
        removeLabel={remove}
        defaultValue={["dine-in", "delivery"]}
        onChange={onChange}
      />,
    );
    act(() => screen.getByRole("button", { name: "Remove Dine in" }).click());
    expect(onChange).toHaveBeenLastCalledWith(["delivery"]);
    expect(screen.queryByText("Dine in")).toBeNull();
  });

  it("shows the value it is given when controlled", () => {
    const { rerender } = render(
      <MultiSelect label="Channels" items={ITEMS} removeLabel={remove} value={["takeaway"]} />,
    );
    expect(screen.getByRole("grid", { name: "Channels" }).textContent).toContain("Takeaway");
    rerender(<MultiSelect label="Channels" items={ITEMS} removeLabel={remove} value={[]} />);
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("draws no remove buttons when read-only", () => {
    render(
      <MultiSelect
        label="Channels"
        items={ITEMS}
        removeLabel={remove}
        defaultValue={["takeaway"]}
        isReadOnly
      />,
    );
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
  });

  it("opens the list from its button", () => {
    render(<MultiSelect label="Channels" items={ITEMS} removeLabel={remove} />);
    open();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("matches the shared contract and refuses selectionMode and inputValue", () => {
    expectTypeOf<MultiSelectProps>().toExtend<MultiSelectContractProps>();
    // @ts-expect-error the field is always multiple
    createElement(MultiSelect, { items: [], selectionMode: "single" });
    // @ts-expect-error the field owns the typed text
    createElement(MultiSelect, { items: [], inputValue: "x" });
  });
});
