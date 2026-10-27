/**
 * Stackra file contract:
 * Purpose: proves the separator page titles the document, shows one rule between paragraphs, a rule per level, vertical rules between links with their orientation, a named rule, and a live rule that turns from horizontal to vertical.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0022 (test placement).
 */
// @covers sta-350:FR-032 sta-350:P-030
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { Separator } from "#src/routes/separator/separator";
import { SeparatorRoute } from "#src/routes/separator/separator.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Separator />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

/** The rule of the live sample. */
const liveRule = () => screen.getByTestId("live-rule");

describe("Separator page", () => {
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

  it("titles the page and the document, and sits at /separator under Surfaces", () => {
    renderPage();
    expect(routePath(SeparatorRoute)).toBe("/separator");
    expect(SeparatorRoute.category).toBe("Layout");
    expect(screen.getByRole("heading", { level: 1, name: "Separator" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Separator · Stackra Playground");
  });

  it("shows one horizontal rule between the paragraphs and a rule per level", () => {
    renderPage();
    expect(section("Horizontal").getAllByRole("separator")).toHaveLength(1);
    const levels = section("Levels").getAllByRole("separator");
    expect(
      levels.map((rule) =>
        [...rule.classList].find((name) => /^separator--(?!horizontal)/.test(name)),
      ),
    ).toEqual([
      "separator--default",
      "separator--secondary",
      "separator--tertiary",
      "separator--default",
    ]);
  });

  it("puts a vertical rule between each pair of links, with its orientation", () => {
    renderPage();
    const vertical = section("Vertical");
    expect(vertical.getAllByRole("link")).toHaveLength(3);
    const rules = vertical.getAllByRole("separator");
    expect(rules).toHaveLength(2);
    for (const rule of rules) expect(rule.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("names the rule between the two groups of controls", () => {
    renderPage();
    expect(
      section("Labelled")
        .getByRole("separator", { name: "Between character and paragraph styles" })
        .getAttribute("aria-orientation"),
    ).toBe("vertical");
  });

  it("turns the live rule from horizontal to vertical and back", () => {
    renderPage();
    const live = section("Try it");
    expect(liveRule().getAttribute("data-orientation")).toBe("horizontal");
    act(() => live.getByRole("button", { name: "Turn the rule" }).click());
    expect(liveRule().getAttribute("data-orientation")).toBe("vertical");
    expect(live.getByText("The rule is vertical.")).toBeTruthy();
    act(() => live.getByRole("button", { name: "Turn the rule" }).click());
    expect(liveRule().getAttribute("data-orientation")).toBe("horizontal");
  });
});
