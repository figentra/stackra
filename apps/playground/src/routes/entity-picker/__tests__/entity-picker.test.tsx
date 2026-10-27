/**
 * Stackra file contract:
 * Purpose: proves the entity picker page titles the document, shows one record and several as tags named for removal,
 *          records with avatars and icons, a slow server's named spinner, a failing server's message beside the list,
 *          the create-new row that picks the record it makes, each state, and a live owner and followers that the page
 *          reports.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia, a stand-in IntersectionObserver and fake
 *           timers for the pretend servers; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0318; ADR 0022 (test placement).
 */
// @covers sta-350:FR-201
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { EntityPicker } from "#src/routes/entity-picker/entity-picker";
import { EntityPickerRoute } from "#src/routes/entity-picker/entity-picker.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <EntityPicker />
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
/** Lets the pretend server answer: its timer runs, then the promise it settles. */
const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
/** A typed search: the picker's 250 ms pause, then the pretend server's 300 ms, with room to spare. */
const TYPED = 600;

describe("Entity picker page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    vi.stubGlobal(
      "IntersectionObserver",
      class {
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

  it("titles the page and the document, and sits at /entity-picker under Selection", () => {
    renderPage();
    expect(EntityPickerRoute.path).toBe("/entity-picker");
    expect(EntityPickerRoute.category).toBe("Selection");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Entity picker" })).toBeTruthy();
    expect(document.title).toBe("Entity picker · Stackra Playground");
  });

  it("shows one record by its name and several as tags whose buttons say whom they remove", () => {
    renderPage();
    expect(
      section("Basics").getByRole<HTMLInputElement>("combobox", { name: /Reviewer/ }).value,
    ).toBe("Grace Hopper");
    expect(
      section("Several records").getByRole("button", { name: "Remove Ada Lovelace" }),
    ).toBeTruthy();
    expect(
      section("Several records").getByRole("button", { name: "Remove Alan Turing" }),
    ).toBeTruthy();
  });

  it("lists the first people with their second line once the server answers", async () => {
    renderPage();
    type(section("Basics").getByRole("combobox", { name: "Owner" }), "");
    await wait(300);
    expect(screen.getByRole("option", { name: /Ada Lovelace/ }).textContent).toContain(
      "ada@example.com",
    );
  });

  it("names the slow server's spinner and announces the failing server beside the list", async () => {
    renderPage();
    type(section("A slow or failing server").getByRole("combobox", { name: /slow server/ }), "a");
    expect(screen.getByRole("status", { name: "Loading people" })).toBeTruthy();
    await wait(2000);
    act(() => (document.activeElement as HTMLElement | null)?.blur());
    type(section("A slow or failing server").getByRole("combobox", { name: /offline/ }), "a");
    await wait(TYPED);
    const failed = screen.getByText("People could not be loaded. Type to try again.");
    expect(failed.getAttribute("role")).toBe("status");
  });

  it("offers to add a name nobody has, and picks the record it makes", async () => {
    renderPage();
    const input = section("Create a record").getByRole<HTMLInputElement>("combobox", {
      name: "Assignee",
    });
    type(input, "Mary Jackson");
    await wait(TYPED);
    press(screen.getByRole("option", { name: "Add “Mary Jackson”" }));
    await wait(0);
    expect(input.value).toBe("Mary Jackson");
  });

  it("refuses change in the disabled and read-only states", () => {
    renderPage();
    const states = section("States");
    expect(states.getByRole<HTMLInputElement>("combobox", { name: "Disabled" }).disabled).toBe(
      true,
    );
    expect(states.getByRole<HTMLInputElement>("combobox", { name: "Read-only" }).readOnly).toBe(
      true,
    );
    expect(states.queryByRole("button", { name: /Remove/ })).toBeNull();
  });

  it("reports the live owner and followers", async () => {
    renderPage();
    const live = section("Try it");
    expect(screen.getByTestId("entity-picker-owner").textContent).toBe("Owner: none");
    type(live.getByRole("combobox", { name: "Owner" }), "ada");
    await wait(TYPED);
    press(screen.getByRole("option", { name: /Ada Lovelace/ }));
    expect(screen.getByTestId("entity-picker-owner").textContent).toBe("Owner: Ada Lovelace");
    expect(screen.getByTestId("entity-picker-followers").textContent).toBe("Followers: none");
  });
});
