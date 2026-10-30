/**
 * Stackra file contract:
 * Purpose: proves the web InlineSelect: an inline trigger named by its label that shows the first item by default,
 *          opens a list, reports the picked id, keeps its own pick when uncontrolled, follows `value` when controlled,
 *          marks a refused item and refuses input while disabled.
 * Boundary: jsdom with React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";

import { InlineSelect } from "#react/inline-select/inline-select";

const ITEMS = [
  { id: "day", label: "Daily" },
  { id: "week", label: "Weekly" },
  { id: "year", label: "Yearly", isDisabled: true },
];
const press = (element: HTMLElement) => act(() => element.click());
const trigger = () => screen.getByRole("button", { name: /Every/ });

describe("InlineSelect (web)", () => {
  it("shows the first item, opens the list and keeps its own pick", () => {
    const onChange = vi.fn();
    render(<InlineSelect label="Every" items={ITEMS} onChange={onChange} className="x-inline" />);
    expect(trigger().textContent).toContain("Daily");
    expect(trigger().className).toContain("x-inline");
    press(trigger());
    const list = screen.getByRole("listbox");
    expect(within(list).getByRole("option", { name: "Yearly" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    press(within(list).getByRole("option", { name: "Weekly" }));
    expect(onChange).toHaveBeenLastCalledWith("week");
    expect(trigger().textContent).toContain("Weekly");
  });

  it("follows value when controlled and starts from defaultValue", () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <InlineSelect label="Every" items={ITEMS} value="day" onChange={onChange} />,
    );
    press(trigger());
    press(within(screen.getByRole("listbox")).getByRole("option", { name: "Weekly" }));
    expect(onChange).toHaveBeenLastCalledWith("week");
    expect(trigger().textContent).toContain("Daily");
    unmount();
    render(<InlineSelect label="Every" items={ITEMS} defaultValue="week" />);
    expect(trigger().textContent).toContain("Weekly");
  });

  it("refuses input while disabled", () => {
    render(<InlineSelect label="Every" items={ITEMS} isDisabled />);
    expect(trigger().hasAttribute("disabled")).toBe(true);
    press(trigger());
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
