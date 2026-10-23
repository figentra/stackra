/**
 * Stackra file contract:
 * Purpose: proves the badge page titles the document, labels fifteen badges for screen readers in the variants section, shows the four corner captions and the dots, and counts a press on the control's button without the badge taking it.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0022 (test placement).
 */
// @covers sta-350:FR-040 sta-350:P-030
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Badge } from "#src/routes/badge/badge";
import { BadgeRoute } from "#src/routes/badge/badge.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <Badge />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Badge page", () => {
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

  it("titles the page and the document, and sits at /badge under Status", () => {
    renderPage();
    expect(BadgeRoute.path).toBe("/badge");
    expect(BadgeRoute.category).toBe("Status");
    expect(screen.getByRole("heading", { level: 1, name: "Badge" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Badge · Stackra Playground");
  });

  it("labels fifteen badges, one per variant and tone", () => {
    renderPage();
    const variants = section("Variants and tones");
    expect(variants.getAllByText(/: 5 new$/)).toHaveLength(15);
    expect(variants.getByText("accent soft: 5 new")).toBeTruthy();
  });

  it("captions the four logical corners", () => {
    renderPage();
    const corners = section("Corners");
    for (const placement of ["top-end", "top-start", "bottom-end", "bottom-start"]) {
      expect(corners.getByText(placement)).toBeTruthy();
    }
    expect(corners.getByText("Dot at top-start")).toBeTruthy();
  });

  it("shows the three presence dots with their names", () => {
    renderPage();
    const dots = section("Dots");
    for (const name of ["Online", "Away", "Busy"]) expect(dots.getByText(name)).toBeTruthy();
  });

  it("names the control by its count and counts presses on the button", () => {
    renderPage();
    const control = section("On a control");
    const button = control.getByRole("button", { name: "Notifications, 3 unread" });
    expect(screen.getByTestId("press-count").textContent).toBe("Pressed 0 times.");
    act(() => button.click());
    expect(control.getByRole("button", { name: "Notifications, 4 unread" })).toBeTruthy();
    expect(screen.getByTestId("press-count").textContent).toBe("Pressed 1 time.");
  });

  it("leaves the control's own badge unlabelled and hidden", () => {
    renderPage();
    const badge = section("On a control")
      .getByRole("button")
      .closest('[data-slot="badge-anchor"]')
      ?.querySelector('[data-slot="badge"]');
    expect(badge?.getAttribute("aria-hidden")).toBe("true");
    expect(badge?.querySelector(".sr-only")).toBeNull();
  });
});
