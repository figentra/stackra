/**
 * Stackra file contract:
 * Purpose: proves the web EntityPicker names its input by its label, asks nothing until its list opens, asks for the
 *          first records when its button opens the list, searches the typed text once the user pauses, drops an answer
 *          a later search has replaced, asks for the next page at the end of the list, reports the whole record (or
 *          the list of them) and shows a chosen label, shows the chosen records of multiple mode as tags whose remove
 *          buttons say which record they remove, shows a spinner, the empty message and the failure, offers and runs
 *          the create-new row, honours read-only, passes unknown props through and refuses HeroUI's names for what it
 *          owns.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded. The browser's IntersectionObserver is
 *           replaced by a recording stand-in, which is how the end of the list is reached. A pause of 0 ms keeps the
 *           searches quick while still going through the timer.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0318; ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-198 sta-350:FR-199 sta-350:P-078
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import type { EntityOption } from "#contracts/types/entity-option.type";
import type { EntityOptionPage } from "#contracts/types/entity-option-page.type";
import type { EntityPickerContractProps } from "#contracts/types/entity-picker-contract-props.type";
import { EntityPicker, type EntityPickerProps } from "#react/entity-picker/entity-picker";

const press = (element: HTMLElement) => act(() => element.click());

const PEOPLE: readonly EntityOption[] = [
  { id: "ada", label: "Ada Lovelace", description: "ada@example.com", avatar: { name: "Ada" } },
  { id: "alan", label: "Alan Turing", avatar: { icon: "user-round" } },
  { id: "grace", label: "Grace Hopper", isDisabled: true },
];

/** Answers from PEOPLE by label, two records a page, the cursor being the index of the next one. */
const answer = (search: string, cursor?: string): EntityOptionPage => {
  const matches = PEOPLE.filter((person) =>
    person.label.toLowerCase().includes(search.toLowerCase()),
  );
  const start = cursor === undefined ? 0 : Number(cursor);
  const next = start + 2;
  return {
    items: matches.slice(start, next),
    nextCursor: next < matches.length ? String(next) : null,
  };
};

const people = () =>
  vi.fn((search: string, cursor?: string) => Promise.resolve(answer(search, cursor)));

/** Types into the field the way a person does: focus first, which is what lets the list open. */
const type = (text: string) => {
  const input = screen.getByRole("combobox");
  act(() => input.focus());
  fireEvent.change(input, { target: { value: text } });
};

/** Opens the list with its button, as a pointer user does. */
const openList = () => {
  const input = screen.getByRole("combobox");
  const button = input.closest('[data-slot="combo-box"]')?.querySelector("button");
  if (!(button instanceof HTMLElement)) throw new Error("the list button is missing");
  press(button);
};

const optionKeys = () =>
  within(screen.getByRole("listbox"))
    .queryAllByRole("option")
    .map((option) => option.getAttribute("data-key"));

/** Callbacks the stand-in observer was given, so a test can say "the end of the list is in view". */
const observed: IntersectionObserverCallback[] = [];

describe("EntityPicker (web)", () => {
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

  it("names the input by its label and asks for nothing until the list opens", () => {
    const load = people();
    render(<EntityPicker loadOptions={load} label="Owner" description="Who answers for it" />);
    const input = screen.getByRole("combobox", { name: /Owner/ });
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("Who answers for it").id,
    );
    expect(load).not.toHaveBeenCalled();
  });

  it("asks for the first records when its button opens the list, and lists them with their second line", async () => {
    const load = people();
    render(<EntityPicker loadOptions={load} label="Owner" />);
    openList();
    expect(load).toHaveBeenCalledWith("", undefined);
    expect(await screen.findByRole("option", { name: /Ada Lovelace/ })).toBeTruthy();
    expect(optionKeys()).toEqual(["ada", "alan"]);
    expect(screen.getByRole("option", { name: /Ada Lovelace/ }).textContent).toContain(
      "ada@example.com",
    );
  });

  it("asks for the first records on focus, where HeroUI opens the list, and the typed text once the user pauses", async () => {
    const load = people();
    render(<EntityPicker loadOptions={load} label="Owner" debounceMs={30} />);
    type("a");
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenLastCalledWith("", undefined);
    type("al");
    type("ala");
    expect(load).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(load).toHaveBeenLastCalledWith("ala", undefined));
    expect(load).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(optionKeys()).toEqual(["alan"]));
  });

  it("drops an answer that a later search has replaced", async () => {
    const answers: ((page: EntityOptionPage) => void)[] = [];
    const load = vi.fn(() => new Promise<EntityOptionPage>((resolve) => answers.push(resolve)));
    render(<EntityPicker loadOptions={load} label="Owner" debounceMs={0} />);
    // Focus asks for "" at once; "a" and then "al" follow, each after the pause.
    type("a");
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    type("al");
    await waitFor(() => expect(load).toHaveBeenCalledTimes(3));
    await act(async () => answers[2]?.({ items: [PEOPLE[1] as EntityOption] }));
    await act(async () => answers[1]?.({ items: [PEOPLE[0] as EntityOption] }));
    await act(async () => answers[0]?.({ items: [PEOPLE[2] as EntityOption] }));
    expect(optionKeys()).toEqual(["alan"]);
  });

  it("asks for the next page with the cursor of the last when the end of the list comes into view", async () => {
    const load = people();
    render(<EntityPicker loadOptions={load} label="Owner" />);
    openList();
    await screen.findByRole("option", { name: /Ada Lovelace/ });
    act(() => {
      for (const callback of observed) {
        callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      }
    });
    expect(load).toHaveBeenLastCalledWith("", "2");
    await waitFor(() => expect(optionKeys()).toEqual(["ada", "alan", "grace"]));
    expect(screen.getByRole("option", { name: /Grace Hopper/ }).getAttribute("aria-disabled")).toBe(
      "true",
    );
  });

  it("reports the whole record when one is picked, and shows its label", async () => {
    const onChange = vi.fn();
    render(<EntityPicker loadOptions={people()} label="Owner" onChange={onChange} />);
    openList();
    press(await screen.findByRole("option", { name: /Alan Turing/ }));
    expect(onChange).toHaveBeenLastCalledWith(PEOPLE[1]);
    await waitFor(() =>
      expect(screen.getByRole<HTMLInputElement>("combobox").value).toBe("Alan Turing"),
    );
  });

  it("shows the label of a chosen record no search has listed, and follows `value` when controlled", () => {
    const xavier = { id: "x", label: "Xavier" };
    const { rerender } = render(
      <EntityPicker loadOptions={people()} label="Owner" value={xavier} onChange={vi.fn()} />,
    );
    expect(screen.getByRole<HTMLInputElement>("combobox").value).toBe("Xavier");
    rerender(
      <EntityPicker
        loadOptions={people()}
        label="Owner"
        value={PEOPLE[0] as EntityOption}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole<HTMLInputElement>("combobox").value).toBe("Ada Lovelace");
  });

  it("picks several in multiple mode, reports the records and shows them as tags named for removal", async () => {
    const onChange = vi.fn();
    render(
      <EntityPicker
        loadOptions={people()}
        label="Reviewers"
        selectionMode="multiple"
        removeLabel={(name) => `Remove ${name}`}
        defaultValue={[PEOPLE[0] as EntityOption]}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("grid", { name: "Reviewers" })).toBeTruthy();
    openList();
    press(await screen.findByRole("option", { name: /Alan Turing/ }));
    expect(onChange).toHaveBeenLastCalledWith([PEOPLE[0], PEOPLE[1]]);
    press(screen.getByRole("button", { name: "Remove Ada Lovelace", hidden: true }));
    expect(onChange).toHaveBeenLastCalledWith([PEOPLE[1]]);
  });

  it("gives no remove button to the tags of a read-only field", () => {
    render(
      <EntityPicker
        loadOptions={people()}
        label="Reviewers"
        selectionMode="multiple"
        removeLabel={(name) => `Remove ${name}`}
        defaultValue={[PEOPLE[0] as EntityOption]}
        isReadOnly
      />,
    );
    expect(screen.getByRole<HTMLInputElement>("combobox").readOnly).toBe(true);
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
  });

  it("shows a named spinner while the first answer is on its way", () => {
    render(
      <EntityPicker
        loadOptions={() => new Promise<EntityOptionPage>(() => undefined)}
        label="Owner"
        loadingLabel="Loading people"
      />,
    );
    openList();
    expect(screen.getByRole("status", { name: "Loading people" })).toBeTruthy();
  });

  it("says what it says when nothing matches", async () => {
    render(<EntityPicker loadOptions={people()} label="Owner" emptyMessage="No people found" />);
    type("zzz");
    expect(await screen.findByText("No people found")).toBeTruthy();
  });

  it("announces a failed load beside the list", async () => {
    render(
      <EntityPicker
        loadOptions={() => Promise.reject(new Error("offline"))}
        label="Owner"
        loadErrorMessage="People could not be loaded. Type to try again."
      />,
    );
    openList();
    const status = await screen.findByText("People could not be loaded. Type to try again.");
    expect(status.getAttribute("role")).toBe("status");
    expect(screen.getByRole("listbox").contains(status)).toBe(false);
  });

  it("offers to create what was typed, and picks the record the app returns", async () => {
    const katherine = { id: "kj", label: "Katherine Johnson" };
    const onCreate = vi.fn(() => Promise.resolve(katherine));
    const onChange = vi.fn();
    render(
      <EntityPicker
        loadOptions={people()}
        label="Owner"
        debounceMs={0}
        onCreate={onCreate}
        createLabel={(text) => `Add “${text}”`}
        onChange={onChange}
      />,
    );
    type("Katherine Johnson");
    press(await screen.findByRole("option", { name: "Add “Katherine Johnson”" }));
    // `onCreate` runs a step later, so one that throws at once is a rejection too.
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Katherine Johnson"));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(katherine));
    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ id: -1 }));
  });

  it("offers no create row without a `createLabel`, or for a text a record already has", async () => {
    const { rerender } = render(
      <EntityPicker loadOptions={people()} label="Owner" debounceMs={0} onCreate={vi.fn()} />,
    );
    type("Ada Lovelace");
    await screen.findByRole("option", { name: /Ada Lovelace/ });
    expect(screen.queryByRole("option", { name: /Add/ })).toBeNull();
    rerender(
      <EntityPicker
        loadOptions={people()}
        label="Owner"
        debounceMs={0}
        onCreate={vi.fn()}
        createLabel={(text) => `Add “${text}”`}
      />,
    );
    expect(screen.queryByRole("option", { name: /Add/ })).toBeNull();
  });

  it("passes unknown props through", () => {
    const { container } = render(
      <EntityPicker loadOptions={people()} label="Owner" data-testid="field" className="mine" />,
    );
    const root = container.querySelector('[data-slot="combo-box"]');
    expect(root?.getAttribute("data-testid")).toBe("field");
    expect(root?.classList.contains("mine")).toBe(true);
  });

  it("types: extends the contract, refuses HeroUI's names for what it owns, and tells the modes apart", () => {
    expectTypeOf<EntityPickerProps>().toExtend<EntityPickerContractProps>();
    const load = people();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error the records come from `loadOptions`, never `items`
    void (<EntityPicker loadOptions={load} items={[]} />);
    // @ts-expect-error the picker owns the typed text
    void (<EntityPicker loadOptions={load} inputValue="x" />);
    // @ts-expect-error the width is `isFullWidth`
    void (<EntityPicker loadOptions={load} fullWidth />);
    // @ts-expect-error several records need a remove label for their tags
    void (<EntityPicker loadOptions={load} selectionMode="multiple" />);
    // @ts-expect-error one record is a record, not a list
    void (<EntityPicker loadOptions={load} value={[PEOPLE[0] as EntityOption]} />);
  });
});
