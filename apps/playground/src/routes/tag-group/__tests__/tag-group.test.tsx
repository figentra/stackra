/**
 * Stackra file contract:
 * Purpose: proves the tag group page titles the document, shows the labelled, described and name-only groups, every
 *          size by both surfaces, the selection modes and each state, and a live group whose tags are selected, removed
 *          and brought back, the page reporting each.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-080 sta-350:FR-081
import { Size, TagVariant } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { TagGroup } from "#src/routes/tag-group/tag-group";
import { TagGroupRoute } from "#src/routes/tag-group/tag-group.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <TagGroup />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("Tag group page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /tag-group under Selection", () => {
    renderPage();
    expect(TagGroupRoute.path).toBe("/tag-group");
    expect(TagGroupRoute.category).toBe("Selection");
    expect(screen.getByRole("heading", { level: 1, name: "Tag group" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Tag group · Stackra Playground");
  });

  it("shows a labelled group, a described one and one named without a visible label", () => {
    renderPage();
    const basics = section("Basics");
    expect(basics.getByRole("grid", { name: "Topics" })).toBeTruthy();
    const described = basics.getByRole("grid", { name: "Amenities" });
    expect(described.getAttribute("aria-describedby")).toContain(
      basics.getByText("Shown on the listing page.").id,
    );
    expect(basics.getByRole("grid", { name: "Post tags" })).toBeTruthy();
  });

  it("shows every size on both surfaces", () => {
    renderPage();
    const sizes = section("Sizes and surfaces");
    for (const variant of TagVariant)
      for (const size of Size) {
        const group = sizes.getByRole("grid", { name: `Size ${size}, ${variant}` });
        const first = group.querySelector('[data-slot="tag"]');
        expect(first?.classList.contains(`tag--${size}`), `${variant} ${size}`).toBe(true);
        expect(first?.classList.contains(`tag--${variant}`), `${variant} ${size}`).toBe(true);
      }
  });

  it("shows no selection, one and several", () => {
    renderPage();
    const selection = section("Selection");
    const selectedIn = (name: string) =>
      [...selection.getByRole("grid", { name }).querySelectorAll('[aria-selected="true"]')].map(
        (tag) => tag.getAttribute("data-key"),
      );
    expect(selectedIn("No selection")).toEqual([]);
    expect(selectedIn("One selected")).toEqual(["travel"]);
    expect(selectedIn("Several selected")).toEqual(["news", "music"]);
  });

  it("shows each state: a refused tag, a disabled group, no buttons while read-only, an error and a message", () => {
    renderPage();
    const states = section("States");
    expect(
      within(states.getByRole("grid", { name: "One disabled tag" }))
        .getByRole("row", { name: "Travel" })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    for (const tag of states
      .getByRole("grid", { name: "Disabled group" })
      .querySelectorAll('[data-slot="tag"]'))
      expect(tag.getAttribute("aria-disabled")).toBe("true");
    expect(
      within(states.getByRole("grid", { name: "Read-only" })).queryByRole("button"),
    ).toBeNull();
    expect(states.getByText("Choose at least one topic.")).toBeTruthy();
    expect(states.getByText("No filters applied.")).toBeTruthy();
  });

  it("selects, removes and restores the live tags, reporting each", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("Selected: open")).toBeTruthy();
    press(live.getByRole("row", { name: "Urgent" }));
    expect(live.getByText("Selected: open, urgent")).toBeTruthy();
    press(live.getByRole("button", { name: "Remove Urgent" }));
    expect(live.queryByRole("row", { name: "Urgent" })).toBeNull();
    expect(live.getByText("Selected: open")).toBeTruthy();
    expect(live.getByText("Removed: urgent")).toBeTruthy();
    press(live.getByRole("button", { name: "Restore the tags" }));
    expect(live.getByRole("row", { name: "Urgent" })).toBeTruthy();
    expect(live.getByText("Removed: none")).toBeTruthy();
  });
});
