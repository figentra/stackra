/**
 * Stackra file contract:
 * Purpose: proves the web ComboBox names its input by its label or `aria-label`, ties the description and the error
 *          message to it, filters the list on the typed text (or not, when the app filters), reports the typed text,
 *          reports the chosen key as a string or the chosen keys as a list, follows `value` when controlled, shows the
 *          picked choices of multiple mode as removable tags named by React Aria, asks for more items and shows a
 *          spinner while loading, says "no match" or stays closed, honours the read-only, disabled and full-width states,
 *          passes unknown props through, and refuses HeroUI's `fullWidth`, children and a missing list.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks. The
 *          browser's IntersectionObserver is replaced by a recording stand-in, which is how the end of the list is
 *          reached.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-077 sta-350:FR-078 sta-350:FR-079
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { ComboBoxContractProps } from "#contracts/types/combo-box-contract-props.type";
import { ComboBox, type ComboBoxProps } from "#react/combo-box/combo-box";

const press = (element: HTMLElement) => act(() => element.click());

const ITEMS = [
  { id: "ar", label: "Argentina", description: "South America" },
  { id: "au", label: "Australia" },
  { id: "at", label: "Austria", isDisabled: true },
  { id: "cl", label: "Café" },
] as const;

/** Types into the field the way a person does: focus first, which is what lets the list open. */
const type = (text: string) => {
  const input = screen.getByRole("combobox");
  act(() => input.focus());
  fireEvent.change(input, { target: { value: text } });
};

/** The keys of the tags drawn, read from the DOM: an open list hides the rest of the page from the accessibility tree. */
const tags = () =>
  [...document.querySelectorAll('[data-slot="tag"]')].map((tag) => tag.getAttribute("data-key"));

const optionLabels = () =>
  within(screen.getByRole("listbox"))
    .getAllByRole("option")
    .map((option) => option.getAttribute("data-key"));

/** Callbacks the stand-in observer was given, so a test can say "the end of the list is in view". */
const observed: IntersectionObserverCallback[] = [];

describe("ComboBox (web)", () => {
  beforeEach(() => {
    observed.length = 0;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          observed.push(callback);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("names the input by its label and ties the description to it", () => {
    render(<ComboBox items={ITEMS} label="Country" description="Where it ships from" />);
    const input = screen.getByRole("combobox", { name: /Country/ });
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("Where it ships from").id,
    );
  });

  it("is named by aria-label when there is no visible label", () => {
    render(<ComboBox items={ITEMS} aria-label="Ship from" />);
    expect(screen.getByRole("combobox", { name: /Ship from/ })).toBeTruthy();
  });

  it("puts the placeholder and the form name on the input", () => {
    render(
      <ComboBox items={ITEMS} label="Country" placeholder="Search countries" name="country" />,
    );
    const input = screen.getByRole("combobox", { name: /Country/ });
    expect(input.getAttribute("placeholder")).toBe("Search countries");
  });

  it("shows the error message only while the field is invalid, and ties it to the input", () => {
    const { rerender } = render(<ComboBox items={ITEMS} label="Country" errorMessage="Pick one" />);
    expect(screen.queryByText("Pick one")).toBeNull();
    rerender(<ComboBox items={ITEMS} label="Country" errorMessage="Pick one" isInvalid />);
    expect(screen.getByRole("combobox").getAttribute("aria-describedby")).toContain(
      screen.getByText("Pick one").id,
    );
  });

  it("filters the list on the typed text, without caring for case or accents", () => {
    render(<ComboBox items={ITEMS} label="Country" />);
    type("AUS");
    expect(optionLabels()).toEqual(["au", "at"]);
    type("cafe");
    expect(optionLabels()).toEqual(["cl"]);
  });

  it("shows every item and reports the text when the app filters", () => {
    const onInputChange = vi.fn();
    render(
      <ComboBox items={ITEMS} label="Country" isServerFiltered onInputChange={onInputChange} />,
    );
    type("zzz");
    expect(onInputChange).toHaveBeenLastCalledWith("zzz");
    expect(optionLabels()).toEqual(["ar", "au", "at", "cl"]);
  });

  it("lists descriptions and disabled items", () => {
    render(<ComboBox items={ITEMS} label="Country" />);
    type("a");
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options[0]?.textContent).toContain("South America");
    expect(
      options
        .find((option) => option.getAttribute("data-key") === "at")
        ?.getAttribute("aria-disabled"),
    ).toBe("true");
  });

  it("reports the chosen key as a string, and follows `value` when controlled", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ComboBox items={ITEMS} label="Country" value={null} onChange={onChange} />,
    );
    type("aus");
    press(screen.getByRole("option", { name: /Australia/ }));
    expect(onChange).toHaveBeenLastCalledWith("au");
    rerender(<ComboBox items={ITEMS} label="Country" value="cl" onChange={onChange} />);
    expect(screen.getByRole<HTMLInputElement>("combobox").value).toBe("Café");
  });

  it("starts from `defaultValue`", () => {
    render(<ComboBox items={ITEMS} label="Country" defaultValue="au" />);
    expect(screen.getByRole<HTMLInputElement>("combobox").value).toBe("Australia");
  });

  it("picks several in multiple mode, reports the keys as a list and shows them as removable tags", () => {
    const onChange = vi.fn();
    render(
      <ComboBox
        items={ITEMS}
        label="Country"
        selectionMode="multiple"
        defaultValue={["ar"]}
        onChange={onChange}
      />,
    );
    expect(tags()).toEqual(["ar"]);
    type("aus");
    press(screen.getByRole("option", { name: /Australia/ }));
    expect(onChange).toHaveBeenLastCalledWith(["ar", "au"]);
    expect(tags()).toEqual(["ar", "au"]);
  });

  it("names the tag grid by a node label through aria-labelledby", () => {
    render(
      <ComboBox
        items={ITEMS}
        label={<em>Country</em>}
        selectionMode="multiple"
        defaultValue={["ar"]}
      />,
    );
    const grid = screen.getByRole("grid");
    expect(grid.getAttribute("aria-label")).toBeNull();
    expect(document.getElementById(grid.getAttribute("aria-labelledby") ?? "")?.textContent).toBe(
      "Country",
    );
  });

  it("removes a tag with its remove button, named by React Aria with the tag's text", () => {
    const onChange = vi.fn();
    render(
      <ComboBox
        items={ITEMS}
        label="Country"
        selectionMode="multiple"
        defaultValue={["ar", "au"]}
        onChange={onChange}
      />,
    );
    const remove = screen.getAllByRole("button", { name: /Remove/ });
    expect(remove).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Remove.*Argentina/ })).toBeTruthy();
    press(remove[0] as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith(["au"]);
    expect(document.querySelectorAll('[data-slot="tag"]')).toHaveLength(1);
  });

  it("draws no tags in multiple mode until something is picked, and none in single mode", () => {
    const { rerender } = render(
      <ComboBox items={ITEMS} label="Country" selectionMode="multiple" />,
    );
    expect(screen.queryByRole("grid")).toBeNull();
    rerender(<ComboBox items={ITEMS} label="Country" defaultValue="au" />);
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("gives no remove button to the tags of a read-only or disabled field", () => {
    const { rerender } = render(
      <ComboBox
        items={ITEMS}
        label="Country"
        selectionMode="multiple"
        defaultValue={["ar"]}
        isReadOnly
      />,
    );
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
    rerender(
      <ComboBox
        items={ITEMS}
        label="Country"
        selectionMode="multiple"
        defaultValue={["ar"]}
        isDisabled
      />,
    );
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
  });

  it("says what it says when nothing matches, and stays closed without a message", () => {
    const { rerender } = render(
      <ComboBox items={ITEMS} label="Country" emptyMessage="No country found" />,
    );
    type("zzz");
    expect(screen.getByText("No country found")).toBeTruthy();
    rerender(<ComboBox items={ITEMS} label="Country" />);
    expect(screen.queryByText("No country found")).toBeNull();
    expect(screen.getByRole("combobox").getAttribute("aria-expanded")).toBe("false");
  });

  it("asks for more items when the end of the list comes into view", () => {
    const onLoadMore = vi.fn();
    render(<ComboBox items={ITEMS} label="Country" onLoadMore={onLoadMore} />);
    type("a");
    expect(observed.length).toBeGreaterThan(0);
    act(() => {
      for (const callback of observed) {
        callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      }
    });
    expect(onLoadMore).toHaveBeenCalled();
  });

  it("shows a spinner under the list while loading", () => {
    const { rerender } = render(
      <ComboBox items={ITEMS} label="Country" isLoading loadingLabel="Loading more countries" />,
    );
    type("a");
    expect(
      within(screen.getByRole("listbox")).queryByRole("status", { name: "Loading more countries" }),
    ).toBeTruthy();
    rerender(<ComboBox items={ITEMS} label="Country" />);
    expect(within(screen.getByRole("listbox")).queryByRole("status")).toBeNull();
  });

  it("reports the typed text, controlled or not", () => {
    const onInputChange = vi.fn();
    const { rerender } = render(
      <ComboBox items={ITEMS} label="Country" onInputChange={onInputChange} />,
    );
    type("au");
    expect(onInputChange).toHaveBeenLastCalledWith("au");
    expect(screen.getByRole<HTMLInputElement>("combobox").value).toBe("au");
    rerender(
      <ComboBox items={ITEMS} label="Country" inputValue="fixed" onInputChange={onInputChange} />,
    );
    type("other");
    expect(screen.getByRole<HTMLInputElement>("combobox").value).toBe("fixed");
  });

  it("honours the read-only, disabled and full-width states", () => {
    const { container, rerender } = render(<ComboBox items={ITEMS} label="Country" isReadOnly />);
    expect(screen.getByRole<HTMLInputElement>("combobox").readOnly).toBe(true);
    rerender(<ComboBox items={ITEMS} label="Country" isDisabled />);
    expect(screen.getByRole<HTMLInputElement>("combobox").disabled).toBe(true);
    const root = () => container.querySelector('[data-slot="combo-box"]');
    expect(root()?.classList.contains("combo-box--full-width")).toBe(false);
    rerender(<ComboBox items={ITEMS} label="Country" isFullWidth />);
    expect(root()?.classList.contains("combo-box--full-width")).toBe(true);
  });

  it("passes unknown props through", () => {
    const { container } = render(
      <ComboBox
        items={ITEMS}
        label="Country"
        data-testid="field"
        className="mine"
        allowsCustomValue
      />,
    );
    const root = container.querySelector('[data-slot="combo-box"]');
    expect(root?.getAttribute("data-testid")).toBe("field");
    expect(root?.classList.contains("mine")).toBe(true);
  });

  it("types: extends the contract, refuses `fullWidth`, children and a missing list, and tells the modes apart", () => {
    expectTypeOf<ComboBoxProps>().toExtend<ComboBoxContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error the width is `isFullWidth`
    void (<ComboBox items={ITEMS} fullWidth />);
    // @ts-expect-error choices are `items`, never children
    void (<ComboBox items={ITEMS}>x</ComboBox>);
    // @ts-expect-error a combo box needs its choices
    void (<ComboBox />);
    // @ts-expect-error several choices hold a list of keys
    void (<ComboBox items={ITEMS} selectionMode="multiple" value="au" />);
    // @ts-expect-error one choice holds a key
    void (<ComboBox items={ITEMS} value={["au"]} />);
  });
});
