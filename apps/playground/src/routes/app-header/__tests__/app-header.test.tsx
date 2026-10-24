/**
 * Stackra file contract:
 * Purpose: proves the app header page titles the document, draws the bar with every part in order and each part alone,
 *          holds no banner landmark (every bar sits in this page's main), draws the Arabic bar in a right-to-left block
 *          with Arabic text, and runs the live bar: the search text, the bell's count and the account menu's choice
 *          are each reported below it.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded. A role query
 *           finds nothing outside an open menu (React Aria hides the page behind it), so each case holds what it needs
 *           before it opens one.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0314; ADR 0022 (test placement).
 */
// @covers sta-350:FR-168
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { AppHeader } from "#src/routes/app-header/app-header";
import { AppHeaderRoute } from "#src/routes/app-header/app-header.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <AppHeader />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("App header page", () => {
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

  it("titles the page and the document, and sits at /app-header under Shell", () => {
    renderPage();
    expect(AppHeaderRoute.path).toBe("/app-header");
    expect(AppHeaderRoute.category).toBe("Shell");
    expect(screen.getByRole("heading", { level: 1, name: "App header" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("App header · Stackra Playground");
  });

  it("draws five bars in the parts section, the first with every part in order", () => {
    renderPage();
    const parts = section("Parts");
    expect(document.querySelectorAll("#app-header-parts ~ ul > li header")).toHaveLength(5);
    const first = document.querySelector("#app-header-parts ~ ul > li header") as HTMLElement;
    const partsInOrder = [
      first.querySelector('button[aria-label="Open navigation"]'),
      first.querySelector("[data-slot='app-header-title']"),
      first.querySelector('input[aria-label="Search orders"]'),
      first.querySelector('button[aria-label="Notifications, 2 unread"]'),
      first.querySelector('button[aria-label="Account menu"]'),
    ] as HTMLElement[];
    partsInOrder.forEach((part, index) => {
      expect(part).toBeTruthy();
      const before = partsInOrder[index - 1];
      if (before)
        expect(
          before.compareDocumentPosition(part) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });
    expect(parts.getAllByRole("searchbox", { name: "Search orders" })).toHaveLength(2);
  });

  it("holds no banner landmark and no heading from a bar's title", () => {
    renderPage();
    expect(screen.queryByRole("banner")).toBeNull();
    expect(screen.getAllByRole("heading").map((heading) => heading.tagName)).toEqual([
      "H1",
      "H2",
      "H2",
      "H2",
    ]);
  });

  it("draws the Arabic bar in a right-to-left block with Arabic text", () => {
    renderPage();
    const block = document.querySelector("[data-sample='arabic']") as HTMLElement;
    expect(block.getAttribute("dir")).toBe("rtl");
    expect(block.getAttribute("lang")).toBe("ar");
    expect(within(block).getByText("أكمي")).toBeTruthy();
    expect(within(block).getByRole("button", { name: "الإشعارات" })).toBeTruthy();
    expect(within(block).getByRole("button", { name: "قائمة الحساب" })).toBeTruthy();
  });

  it("reports the search text, the bell's count and the account menu's choice", () => {
    renderPage();
    const live = section("Try it");
    const status = () => live.getAllByRole("status").map((node) => node.textContent);
    expect(status()).toEqual([
      "No search yet.",
      "2 unread notifications.",
      "No account action chosen.",
    ]);

    fireEvent.change(live.getByRole("searchbox", { name: "Search orders" }), {
      target: { value: "refund" },
    });
    expect(status()[0]).toBe("Searching for “refund”.");

    press(live.getByRole("button", { name: "Notifications, 2 unread" }));
    expect(live.getByRole("button", { name: "Notifications, 3 unread" })).toBeTruthy();
    expect(status()[1]).toBe("3 unread notifications.");

    press(live.getByRole("button", { name: "Account menu" }));
    press(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(status()[2]).toBe("Account action chosen: Sign out.");
  });
});
