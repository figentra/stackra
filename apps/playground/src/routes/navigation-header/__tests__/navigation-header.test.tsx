/**
 * Stackra file contract:
 * Purpose: proves the navigation header page titles the document, sits at /navigation-header under Shell, draws six
 *          headers in the parts section (title only, back button, back link, slots, long title, large title) each with
 *          its title as a level 3 heading so the page keeps one `h1`, holds no banner landmark, draws the Arabic header
 *          in a right-to-left block with Arabic text, and runs the live header: the back button, the add action and the
 *          large-title switch are each reported below it.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded, so classes and
 *           attributes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0317; ADR 0022 (test placement).
 */
// @covers sta-350:FR-177
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { NavigationHeader } from "#src/routes/navigation-header/navigation-header";
import { NavigationHeaderRoute } from "#src/routes/navigation-header/navigation-header.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <NavigationHeader />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("Navigation header page", () => {
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

  it("titles the page and the document, and sits at /navigation-header under Shell", () => {
    renderPage();
    expect(NavigationHeaderRoute.path).toBe("/navigation-header");
    expect(NavigationHeaderRoute.category).toBe("Shell");
    expect(screen.getByRole("heading", { level: 1, name: "Navigation header" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Navigation header · Stackra Playground");
  });

  it("draws six headers in the parts section, each with a level 3 title and none a banner", () => {
    renderPage();
    const headers = document.querySelectorAll("#navigation-header-parts ~ ul > li header");
    expect(headers).toHaveLength(6);
    for (const header of headers) expect(header.querySelector("h3")).toBeTruthy();
    // DOM Testing Library calls every header a banner; HTML-AAM makes one inside these sectioning elements none.
    for (const header of document.querySelectorAll("header"))
      expect(header.closest("article, aside, main, nav, section")).not.toBeNull();
  });

  it("draws the back button, the back link and the slots where each sample says", () => {
    renderPage();
    const parts = section("Parts");
    expect(parts.getAllByRole("button", { name: "Back" }).length).toBeGreaterThan(0);
    expect(parts.getByRole("link", { name: "Back to home" }).getAttribute("href")).toBe("/");
    expect(parts.getAllByRole("button", { name: "Add order" }).length).toBeGreaterThan(0);
    expect(parts.getByRole("button", { name: "Notifications" })).toBeTruthy();
  });

  it("draws the title large under the bar in the large-title sample only", () => {
    renderPage();
    const headers = [...document.querySelectorAll("#navigation-header-parts ~ ul > li header")];
    const large = headers.map((header) => {
      const heading = header.querySelector("h3") as HTMLElement;
      return (header.firstElementChild as HTMLElement).contains(heading);
    });
    // Only the last sample moves its heading out of the bar's row.
    expect(large).toEqual([true, true, true, true, true, false]);
  });

  it("draws the Arabic header in a right-to-left block with Arabic text", () => {
    renderPage();
    const block = document.querySelector("[data-sample='arabic']") as HTMLElement;
    expect(block.getAttribute("dir")).toBe("rtl");
    expect(block.getAttribute("lang")).toBe("ar");
    expect(within(block).getByRole("heading", { name: "الطلبات" })).toBeTruthy();
    expect(within(block).getByRole("button", { name: "رجوع" })).toBeTruthy();
  });

  it("reports the back button, the add action and the large title", () => {
    renderPage();
    const live = section("Try it");
    const status = () => live.getAllByRole("status").map((node) => node.textContent);
    expect(status()).toEqual([
      "Back not pressed yet.",
      "No orders added yet.",
      "The title is compact, in the bar.",
    ]);

    press(live.getByRole("button", { name: "Back" }));
    expect(status()[0]).toBe("Back pressed once.");
    press(live.getByRole("button", { name: "Back" }));
    expect(status()[0]).toBe("Back pressed 2 times.");

    press(live.getByRole("button", { name: "Add order" }));
    expect(status()[1]).toBe("1 order added.");

    press(live.getByRole("switch", { name: "Large title" }));
    expect(status()[2]).toBe("The title is large, under the bar.");
    const header = document.querySelector("[data-sample='live'] header") as HTMLElement;
    expect((header.firstElementChild as HTMLElement).querySelector("h3")).toBeNull();
  });
});
