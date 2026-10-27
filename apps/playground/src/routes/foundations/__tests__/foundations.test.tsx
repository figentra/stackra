/**
 * Stackra file contract:
 * Purpose: proves the foundations page renders every token group of the stackra theme from @stackra/tokens: each
 *          colour role once, in its group, with its oklch-derived hex and its contrast pair and computed ratio for
 *          the scheme on screen, each text style, spacing step, radius, shadow and motion step; and that it titles
 *          the document.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 2 and 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-010
import { STACKRA_THEME } from "@stackra/tokens";
import { ColorRole } from "@stackra/tokens/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { render, screen, within } from "@testing-library/react";

import { Foundations } from "#src/routes/foundations/foundations";
import { FoundationsRoute } from "#src/routes/foundations/foundations.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage(colorScheme: "light" | "dark") {
  render(
    <DesignSystemProvider colorScheme={colorScheme}>
      <Foundations />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => screen.getByRole("region", { name });

describe("Foundations", () => {
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

  it("titles the page and the document, and sits at /foundations", () => {
    renderPage("light");
    expect(routePath(FoundationsRoute)).toBe("/foundations");
    expect(screen.getByRole("heading", { level: 1, name: FoundationsRoute.title })).toBeTruthy();
    expect(document.title).toBe("Foundations · Stackra Playground");
  });

  it("shows every base colour role once, in six groups, with its light value and contrast pair", () => {
    renderPage("light");
    const colors = within(section("Colour roles"));
    const base = ColorRole.filter((r) => !r.endsWith("-foreground"));
    expect(colors.getAllByRole("listitem")).toHaveLength(base.length);
    for (const role of base)
      expect(colors.getByText(role, { selector: "li > code bdi" })).toBeTruthy();
    expect(colors.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Surfaces",
      "Content",
      "Status",
      "Fields",
      "Controls",
      "Utility",
    ]);
    expect(colors.getAllByText(STACKRA_THEME.colors.accent.hexLight).length).toBeGreaterThan(0);
    expect(
      colors.getAllByText(/: 17\.95:1 \(AAA\)/, { selector: "li bdi" }).length,
    ).toBeGreaterThan(0);
  });

  it("checks segment-foreground on segment, which the kit's report lacks", () => {
    renderPage("light");
    const segment = screen.getByText("segment", { selector: "li > code bdi" }).closest("li");
    expect(segment?.textContent).toMatch(/segment-foreground \/ segment: \d+\.\d\d:1 \(AAA?\)/);
  });

  it("switches the values and ratios to the dark scheme", () => {
    renderPage("dark");
    const colors = within(section("Colour roles"));
    expect(colors.getAllByText("#131518").length).toBeGreaterThan(0); // dark surface, from its oklch
    // danger-foreground on danger: 8.15 in light, 5.69 in dark (the kit's contrast report).
    expect(colors.queryByText(/: 8\.15:1/)).toBeNull();
    expect(colors.getAllByText(/: 5\.69:1/).length).toBeGreaterThan(0);
  });

  it("shows every text style, spacing step, radius, shadow and motion step", () => {
    renderPage("light");
    const count = (name: string) => within(section(name)).getAllByRole("listitem").length;
    expect(count("Typography")).toBe(Object.keys(STACKRA_THEME.typography).length);
    expect(count("Spacing")).toBe(Object.keys(STACKRA_THEME.spacing).length);
    expect(count("Radius")).toBe(2 + Object.keys(STACKRA_THEME.radius.steps).length);
    expect(count("Shadows")).toBe(Object.keys(STACKRA_THEME.shadows).length);
    expect(within(section("Motion")).getAllByRole("row")).toHaveLength(
      1 + Object.keys(STACKRA_THEME.motion).length,
    );
  });
});
