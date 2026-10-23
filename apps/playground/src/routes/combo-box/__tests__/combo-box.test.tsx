/**
 * Stackra file contract:
 * Purpose: proves the combo box page titles the document, shows the labelled, described and name-only fields, one
 *          choice and several as tags, the items with descriptions, each state, and a live field that searches a pretend
 *          server after a short busy moment, loads the next page at the end of the list and reports the chosen key.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia, a stand-in IntersectionObserver and fake
 *          timers for the pretend server; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-078 sta-350:FR-081
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { ComboBox } from "#src/routes/combo-box/combo-box";
import { ComboBoxRoute } from "#src/routes/combo-box/combo-box.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <ComboBox />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());
const type = (input: HTMLElement, text: string) => {
  act(() => input.focus());
  fireEvent.change(input, { target: { value: text } });
};

/** Callbacks the stand-in observer was given, so a test can say "the end of the list is in view". */
const observed: IntersectionObserverCallback[] = [];

describe("Combo box page", () => {
  beforeEach(() => {
    observed.length = 0;
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
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
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /combo-box under Selection", () => {
    renderPage();
    expect(ComboBoxRoute.path).toBe("/combo-box");
    expect(ComboBoxRoute.category).toBe("Selection");
    expect(screen.getByRole("heading", { level: 1, name: "Combo box" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Combo box · Stackra Playground");
  });

  it("shows a labelled field, a described one and one named without a visible label", () => {
    renderPage();
    const basics = section("Basics");
    expect(basics.getByRole("combobox", { name: /Country/ })).toBeTruthy();
    const described = basics.getByRole("combobox", { name: /Ship from/ });
    expect(described.getAttribute("aria-describedby")).toContain(
      basics.getByText("The warehouse the order leaves from.").id,
    );
    expect(basics.getByRole("combobox", { name: /Search countries/ })).toBeTruthy();
  });

  it("shows one choice in the field and several as tags", () => {
    renderPage();
    const modes = section("One or several");
    expect(modes.getByRole<HTMLInputElement>("combobox", { name: /One country/ }).value).toBe(
      "Australia",
    );
    const tags = modes.getByRole("grid", { name: "Several countries" });
    expect(
      [...tags.querySelectorAll('[data-slot="tag"]')].map((tag) => tag.getAttribute("data-key")),
    ).toEqual(["ar", "au", "eg"]);
  });

  it("lists the offices with their descriptions and refuses the disabled one", () => {
    renderPage();
    const input = section("Items").getByRole("combobox", { name: /Office/ });
    type(input, "");
    act(() => input.focus());
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.map((option) => option.getAttribute("data-key"))).toEqual([
      "cai",
      "ber",
      "ldn",
      "nyc",
      "old",
    ]);
    expect(options[0]?.textContent).toContain("Engineering and support");
    expect(options[4]?.getAttribute("aria-disabled")).toBe("true");
  });

  it("shows each state, and says so when nothing matches", () => {
    renderPage();
    const states = section("States");
    expect(states.getByText("Choose a country before you continue.")).toBeTruthy();
    expect(states.getByRole<HTMLInputElement>("combobox", { name: /Disabled/ }).disabled).toBe(
      true,
    );
    expect(states.getByRole<HTMLInputElement>("combobox", { name: /Read-only/ }).readOnly).toBe(
      true,
    );
    type(states.getByRole("combobox", { name: /With a no-match message/ }), "zzz");
    expect(screen.getByText("No country found.")).toBeTruthy();
  });

  it("searches the pretend server after a busy moment, loads the next page and reports the key", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("Showing 8 of 24 countries.")).toBeTruthy();
    const input = live.getByRole("combobox", { name: /Find a country/ });
    type(input, "an");
    expect(screen.getByRole("status", { name: "Loading countries" })).toBeTruthy();
    act(() => vi.advanceTimersByTime(400));
    // Seven countries have "an" in their name, so one short page answers.
    expect(live.getByText("Showing 7 of 7 countries.")).toBeTruthy();
    expect(screen.queryByRole("status", { name: "Loading countries" })).toBeNull();

    type(input, "");
    act(() => vi.advanceTimersByTime(400));
    act(() => {
      for (const callback of observed)
        callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
    });
    act(() => vi.advanceTimersByTime(400));
    expect(live.getByText("Showing 16 of 24 countries.")).toBeTruthy();

    press(screen.getByRole("option", { name: "Austria" }));
    expect(live.getByText("Chosen key: at")).toBeTruthy();
  });
});
