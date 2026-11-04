/**
 * Stackra file contract:
 * Purpose: proves the web Autocomplete: a select button named by its label with its description tied to it; pressing
 *          it opens a list with a search box named by `labels` (or the package's word) that narrows the options on the
 *          typed text, or keeps them all when the app filters; choosing reports the key as a string; a controlled value
 *          shows its label; the typed text is reported; "no match" shows when nothing matches; read-only keeps the list
 *          shut and drops the clear button; and right-to-left draws the same field.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0055; ADR 0022 (test placement); STA-1981.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Autocomplete } from "#react/autocomplete/autocomplete";

const ITEMS = [
  { id: "ar", label: "Argentina", description: "South America" },
  { id: "au", label: "Australia" },
  { id: "at", label: "Austria", isDisabled: true },
  { id: "eg", label: "Egypt" },
] as const;

const press = (element: HTMLElement) => act(() => element.click());

/** The field's button: React Aria names it by the value and the label. */
const trigger = () => screen.getByRole("button", { name: /Country/ });

/** Types into the open list's search box. */
const type = (name: string, text: string) =>
  fireEvent.change(screen.getByRole("searchbox", { name }), { target: { value: text } });

describe("Autocomplete (web)", () => {
  it("is a select named by its label, with its description", () => {
    render(
      <Autocomplete
        label="Country"
        description="Where you live"
        placeholder="Pick one"
        items={ITEMS}
      />,
    );
    expect(trigger()).toBeTruthy();
    expect(screen.getByText("Pick one")).toBeTruthy();
    expect(screen.getByText("Where you live")).toBeTruthy();
  });

  it("narrows the list on the typed text and reports the chosen key", () => {
    const onChange = vi.fn();
    const onInputChange = vi.fn();
    render(
      <Autocomplete
        label="Country"
        items={ITEMS}
        labels={{ search: "Search countries" }}
        onChange={onChange}
        onInputChange={onInputChange}
      />,
    );
    press(trigger());
    expect(screen.getAllByRole("option")).toHaveLength(4);
    type("Search countries", "aus");
    expect(onInputChange).toHaveBeenLastCalledWith("aus");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Australia",
      "Austria",
    ]);
    press(screen.getByRole("option", { name: "Australia" }));
    expect(onChange).toHaveBeenLastCalledWith("au");
  });

  it("keeps every item when the app filters, and says no match", () => {
    const { rerender } = render(
      <Autocomplete label="Country" items={ITEMS} isServerFiltered emptyMessage="Nothing" />,
    );
    press(trigger());
    type("Search", "zzz");
    expect(screen.getAllByRole("option")).toHaveLength(4);
    rerender(<Autocomplete label="Country" items={[]} isServerFiltered emptyMessage="Nothing" />);
    expect(screen.getByText("Nothing")).toBeTruthy();
  });

  it("shows a controlled value", () => {
    render(<Autocomplete label="Country" items={ITEMS} value="eg" />);
    expect(trigger().textContent).toContain("Egypt");
  });

  it("keeps the list shut and drops the clear button while read-only", () => {
    render(<Autocomplete label="Country" items={ITEMS} defaultValue="ar" isReadOnly />);
    press(trigger());
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Clear selection" })).toBeNull();
  });

  it("draws the same field in right-to-left", () => {
    render(
      <div dir="rtl">
        <Autocomplete label="Country" items={ITEMS} labels={{ clear: "مسح" }} defaultValue="ar" />
      </div>,
    );
    expect(trigger().textContent).toContain("Argentina");
    expect(document.querySelector("[aria-label='مسح']")).toBeTruthy();
  });
});
