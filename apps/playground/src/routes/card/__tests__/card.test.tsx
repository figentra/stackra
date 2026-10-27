/**
 * Stackra file contract:
 * Purpose: proves the card page titles the document, shows a level-3 title on each level card and a level-4 title in the nested card, names the article by its title, shows the anatomy, and hides the dismissible card until Show again restores it.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0022 (test placement).
 */
// @covers sta-350:FR-032 sta-350:P-030
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { Card } from "#src/routes/card/card";
import { CardRoute } from "#src/routes/card/card.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Card />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Card page", () => {
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

  it("titles the page and the document, and sits at /card under Surfaces", () => {
    renderPage();
    expect(routePath(CardRoute)).toBe("/card");
    expect(CardRoute.category).toBe("Data display");
    expect(screen.getByRole("heading", { level: 1, name: "Card" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Card · Stackra Playground");
  });

  it("shows one card per level, each with a level-3 title", () => {
    renderPage();
    const levels = section("Levels");
    expect(levels.getAllByRole("heading", { level: 3 })).toHaveLength(4);
    expect(document.querySelectorAll('#card-levels ~ div [data-slot="card"]')).toHaveLength(4);
  });

  it("shows the anatomy with header, title, description, content and footer actions", () => {
    renderPage();
    const anatomy = section("Anatomy");
    expect(anatomy.getByRole("heading", { level: 3, name: "Invoice 1042" })).toBeTruthy();
    expect(anatomy.getByText("Due on the first of next month.")).toBeTruthy();
    expect(anatomy.getByRole("button", { name: "Pay now" })).toBeTruthy();
    expect(anatomy.getByRole("button", { name: "Remind me later" })).toBeTruthy();
  });

  it("places the nested card's title one level below the outer one", () => {
    renderPage();
    const levels = section("Title levels");
    expect(levels.getByRole("heading", { level: 3, name: "Subscription" })).toBeTruthy();
    expect(levels.getByRole("heading", { level: 4, name: "Add-ons" })).toBeTruthy();
  });

  it("names the article by its title", () => {
    renderPage();
    expect(screen.getByRole("article", { name: "Release notes" })).toBeTruthy();
  });

  it("hides the dismissible card on its close button and restores it with Show again", () => {
    renderPage();
    const dismissible = section("Dismissible");
    expect(dismissible.getByRole("heading", { name: "Your changes were saved" })).toBeTruthy();
    act(() => dismissible.getByRole("button", { name: "Dismiss card" }).click());
    expect(dismissible.queryByRole("heading", { name: "Your changes were saved" })).toBeNull();
    expect(dismissible.getByRole("status").textContent).toBe("The card is hidden.");
    act(() => dismissible.getByRole("button", { name: "Show again" }).click());
    expect(dismissible.getByRole("heading", { name: "Your changes were saved" })).toBeTruthy();
  });
});
