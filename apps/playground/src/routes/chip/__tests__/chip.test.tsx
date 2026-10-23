/**
 * Stackra file contract:
 * Purpose: proves the chip page titles the document, shows one chip per variant, tone and size, the icon and context samples, and steps the live chip through variants and tones.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0022 (test placement).
 */
// @covers sta-350:FR-036 sta-350:P-030
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";
import { ChipVariant, Size, Tone } from "@stackra/ui/contracts";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Chip } from "#src/routes/chip/chip";
import { ChipRoute } from "#src/routes/chip/chip.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <Chip />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Chip page", () => {
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

  it("titles the page and the document, and sits at /chip under Status", () => {
    renderPage();
    expect(ChipRoute.path).toBe("/chip");
    expect(ChipRoute.category).toBe("Status");
    expect(screen.getByRole("heading", { level: 1, name: "Chip" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Chip · Stackra Playground");
  });

  it("shows one chip per variant, tone and size, labelled with its tone", () => {
    renderPage();
    const matrix = section("Variants and tones");
    const chips = [...document.querySelectorAll('#chip-matrix ~ div [data-slot="chip"]')];
    expect(chips).toHaveLength(ChipVariant.length * Tone.length * Size.length);
    expect(matrix.getAllByText("success")).toHaveLength(ChipVariant.length * Size.length + 3);
    for (const size of Size)
      expect(matrix.getByRole("heading", { level: 3, name: `Size ${size}` })).toBeTruthy();
  });

  it("shows the start icon, the end icon and both", () => {
    renderPage();
    const icons = section("Icons");
    const chips = [...document.querySelectorAll('#chip-icons ~ ul [data-slot="chip"]')];
    expect(chips.map((chip) => chip.querySelectorAll("svg").length)).toEqual([1, 1, 2]);
    expect(icons.getAllByRole("listitem")).toHaveLength(3);
  });

  it("draws the category chips as list items and the sentence's chip inline", () => {
    renderPage();
    const context = section("In context");
    const list = context.getByRole("list", { name: "Categories" });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Billing", "Shipping", "Returns", "Support"]);
    expect(context.getByText("On track")).toBeTruthy();
  });

  it("steps the live chip through the variants and the tones", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("primary, default")).toBeTruthy();
    act(() => live.getByRole("button", { name: "Next variant" }).click());
    expect(live.getByText("secondary, default")).toBeTruthy();
    act(() => live.getByRole("button", { name: "Next tone" }).click());
    expect(live.getByText("secondary, accent")).toBeTruthy();
  });
});
