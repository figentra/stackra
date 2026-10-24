/**
 * Stackra file contract:
 * Purpose: proves the list page titles the document, shows the basic rows, every slot, every surface level, pressable
 *          and disabled rows, one and several selection, the empty and loading states, and three live examples: a press
 *          the page reports, a selection the page reports in the rows' order, and a list that loads five more rows when
 *          its end shows.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and an `IntersectionObserver` stand-in the
 *           test fires by hand; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0313; ADR 0022 (test placement).
 */
// @covers sta-350:FR-130
import { SurfaceVariant } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { List } from "#src/routes/list/list";
import { ListRoute } from "#src/routes/list/list.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <List />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

/** The callbacks of the observers the stand-in has made, newest last. */
const observers: { fire: () => void; disconnected: boolean }[] = [];

describe("List page", () => {
  beforeEach(() => {
    observers.length = 0;
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        private readonly entry: { fire: () => void; disconnected: boolean };
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          this.entry = { fire: () => callback([{ isIntersecting: true }]), disconnected: false };
          observers.push(this.entry);
        }
        observe() {}
        disconnect() {
          this.entry.disconnected = true;
        }
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /list under Data", () => {
    renderPage();
    expect(ListRoute.path).toBe("/list");
    expect(ListRoute.category).toBe("Data");
    expect(screen.getByRole("heading", { level: 1, name: "List" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("List · Stackra Playground");
  });

  it("shows the basic rows as a plain list", () => {
    renderPage();
    const list = section("Basics").getByRole("list", { name: "Recent orders" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(within(list).getByText("Waiting for payment")).toBeTruthy();
  });

  it("shows an avatar, icons, end content and chevrons in the slots", () => {
    renderPage();
    const team = within(section("Slots").getByRole("list", { name: "Team" }));
    expect(team.getByText("Active")).toBeTruthy();
    expect(team.getByText("12 people")).toBeTruthy();
    const rows = team.getAllByRole("listitem");
    // Two rows have a chevron and a start icon or avatar; the avatar is an image-less element, so count the SVGs.
    expect(rows[0]?.querySelectorAll("svg").length).toBeGreaterThanOrEqual(1);
    expect(rows[1]?.querySelectorAll("svg")).toHaveLength(2);
  });

  it("shows a list on every surface level", () => {
    renderPage();
    const surfaces = section("Surfaces");
    for (const variant of SurfaceVariant) {
      const list = surfaces.getByRole("list", { name: `Surface ${variant}` });
      expect(list.closest(`.surface--${variant}`), variant).toBeTruthy();
    }
  });

  it("shows pressable rows as buttons and disabled ones refused", () => {
    renderPage();
    const pressable = section("Pressable rows");
    expect(pressable.getAllByRole("button")).toHaveLength(4);
    for (const name of [/Profile, disabled/, /Billing, disabled/]) {
      const button = pressable.getByRole("button", { name });
      expect(
        button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true",
      ).toBe(true);
    }
  });

  it("shows one and several rows selected, and a refused row", () => {
    renderPage();
    const selection = section("Selection");
    const selectedIn = (name: string) =>
      within(selection.getByRole("listbox", { name }))
        .getAllByRole("option")
        .filter((option) => option.getAttribute("aria-selected") === "true")
        .map((option) => option.getAttribute("data-key"));
    expect(selectedIn("One selected")).toEqual(["push"]);
    expect(selectedIn("Several selected")).toEqual(["email", "chat"]);
    expect(
      within(selection.getByRole("listbox", { name: "One selected" }))
        .getByRole("option", { name: /SMS/ })
        .getAttribute("aria-disabled"),
    ).toBe("true");
  });

  it("shows an empty list and a loading one that names one spinner", () => {
    renderPage();
    const states = section("Empty and loading");
    expect(states.getByText("No orders yet.")).toBeTruthy();
    expect(states.queryByRole("list", { name: "Empty list" })).toBeNull();
    expect(states.getAllByRole("status", { name: "Loading orders" })).toHaveLength(1);
    expect(states.getByRole("list", { name: "Loading list" })).toBeTruthy();
  });

  it("reports the pressed row", () => {
    renderPage();
    const live = section("Try pressing");
    expect(live.getByText("Pressed: none")).toBeTruthy();
    press(live.getByRole("button", { name: /Order 1043/ }));
    expect(live.getByText("Pressed: Order 1043")).toBeTruthy();
  });

  it("reports the selected ids in the rows' order", () => {
    renderPage();
    const live = section("Try selecting");
    expect(live.getByText("Selected: email")).toBeTruthy();
    press(live.getByRole("option", { name: /Chat/ }));
    press(live.getByRole("option", { name: /Push/ }));
    expect(live.getByText("Selected: email, push, chat")).toBeTruthy();
  });

  it("loads five more rows when the end shows, up to fifteen", () => {
    renderPage();
    const live = section("Try loading more");
    expect(live.getByText("5 rows")).toBeTruthy();
    for (const [loaded, next] of [
      [5, 10],
      [10, 15],
    ] as const) {
      expect(live.getByText(`${loaded} rows`)).toBeTruthy();
      act(() =>
        observers
          .filter((observer) => !observer.disconnected)
          .at(-1)
          ?.fire(),
      );
      expect(live.getAllByRole("status", { name: "Loading orders" })).toHaveLength(1);
      act(() => vi.advanceTimersByTime(400));
      expect(live.getByText(`${next} rows`)).toBeTruthy();
    }
    // Everything is loaded: the list no longer watches for its end.
    expect(observers.filter((observer) => !observer.disconnected)).toHaveLength(0);
  });
});
