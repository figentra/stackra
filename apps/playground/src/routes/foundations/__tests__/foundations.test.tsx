/**
 * Stackra file contract:
 * Purpose: proves the foundations page renders every token group of the stackra theme from @stackra/tokens: each
 *          colour role (with its contrast pair for the scheme on screen), each text style, spacing step, radius,
 *          shadow and motion step.
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

  it("titles the page and sits at /foundations", () => {
    renderPage("light");
    expect(FoundationsRoute.path).toBe("/foundations");
    expect(screen.getByRole("heading", { level: 1, name: FoundationsRoute.title })).toBeTruthy();
  });

  it("shows every base colour role with its light value and contrast pair", () => {
    renderPage("light");
    const colors = within(section("Colour roles"));
    for (const role of ColorRole.filter((r) => !r.endsWith("-foreground")))
      expect(colors.getByText(role, { selector: "li > code" })).toBeTruthy();
    expect(colors.getAllByText(STACKRA_THEME.colors.accent.hexLight).length).toBeGreaterThan(0);
    expect(
      colors.getAllByText(/: 17\.95:1 \(AAA\)/, { selector: "li span" }).length,
    ).toBeGreaterThan(0);
  });

  it("switches the values and ratios to the dark scheme", () => {
    renderPage("dark");
    const colors = within(section("Colour roles"));
    expect(colors.getAllByText(STACKRA_THEME.colors.surface.hexDark).length).toBeGreaterThan(0);
    // danger-foreground on danger: 8.15 in light, 5.69 in dark (the kit's contrast report).
    expect(colors.queryByText(/: 8\.15:1/)).toBeNull();
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
