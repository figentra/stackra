/**
 * Stackra file contract:
 * Purpose: proves the cursor pagination page titles the document, shows the pager on a first, middle, last and only
 *          page and while loading, the load-more form with more, loading and the end, every size and the count with and
 *          without its own sentence, and walks the live pager forward and back and grows the live list over the fake
 *          server, saying a page number nowhere.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and fake timers for the fake server's
 *          delay; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0313 (decision 4); ADR 0022 (test placement).
 */
// @covers sta-350:FR-146
import { Size } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { CursorPagination } from "#src/routes/cursor-pagination/cursor-pagination";
import { CursorPaginationRoute } from "#src/routes/cursor-pagination/cursor-pagination.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <CursorPagination />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const nav = (scope: ReturnType<typeof section>, name: string) =>
  within(scope.getByRole("navigation", { name }));
const press = (element: HTMLElement) => act(() => element.click());
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
/** Whether a press is refused: HeroUI sets `disabled` for a disabled button and `aria-disabled` for a pending one. */
const disabled = (element: HTMLElement) =>
  (element as HTMLButtonElement).disabled || element.getAttribute("aria-disabled") === "true";

describe("Cursor pagination page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /cursor-pagination under Navigation", () => {
    renderPage();
    expect(routePath(CursorPaginationRoute)).toBe("/cursor-pagination");
    expect(CursorPaginationRoute.category).toBe("Navigation");
    expect(screen.getByRole("heading", { level: 1, name: "Cursor pagination" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Cursor pagination · Stackra Playground");
  });

  it("names every navigation landmark once", () => {
    renderPage();
    const names = screen.getAllByRole("navigation").map((node) => node.getAttribute("aria-label"));
    expect(names.length).toBeGreaterThan(10);
    expect(new Set(names).size).toBe(names.length);
  });

  it("shows the pager on a first, middle, last and only page", () => {
    renderPage();
    const pager = section("Pager");
    const buttons = (name: string) => {
      const scope = nav(pager, name);
      return [
        disabled(scope.getByRole("button", { name: "Previous" })),
        disabled(scope.getByRole("button", { name: "Next" })),
      ];
    };
    expect(buttons("First page")).toEqual([true, false]);
    expect(buttons("Middle page")).toEqual([false, false]);
    expect(buttons("Last page")).toEqual([false, true]);
    expect(buttons("Only page")).toEqual([true, true]);
    expect(buttons("Loading the next page")).toEqual([true, true]);
  });

  it("shows load more with more, while loading, and at the end with only its count", () => {
    renderPage();
    const more = section("Load more");
    expect(nav(more, "More to load").getByRole("button", { name: "Load more" })).toBeTruthy();
    expect(nav(more, "Loading more").getByRole("button", { name: "Load more" })).toBeTruthy();
    const end = nav(more, "End of the list");
    expect(end.queryByRole("button")).toBeNull();
    expect(end.getByRole("status").textContent).toBe("Showing 45 items");
  });

  it("shows every size", () => {
    renderPage();
    const sizes = section("Sizes");
    for (const size of Size) {
      const next = nav(sizes, `Size ${size}`).getByRole("button", { name: "Next" });
      expect(next.classList.contains(`button--${size}`), size).toBe(true);
    }
  });

  it("shows the default count sentence and the custom one", () => {
    renderPage();
    const count = section("Count");
    expect(nav(count, "Default sentence").getByRole("status").textContent).toBe("Showing 20 items");
    expect(nav(count, "Custom sentence").getByRole("status").textContent).toBe(
      "20 orders on this page",
    );
  });

  it("says no page number and no total anywhere", () => {
    renderPage();
    expect(document.body.textContent).not.toMatch(/\bpage \d|\bof \d/i);
  });

  it("walks the live pager forward and back, with a loading state in between", () => {
    renderPage();
    const live = section("Try it");
    const pager = nav(live, "Orders, paged");
    const orders = () =>
      within(live.getByRole("list", { name: "Orders on this page" }))
        .getAllByRole("listitem")
        .map((item) => item.textContent);
    expect(orders()[0]).toBe("Order 1001");
    expect(orders()).toHaveLength(10);
    expect(disabled(pager.getByRole("button", { name: "Previous" }))).toBe(true);

    press(pager.getByRole("button", { name: "Next" }));
    expect(live.getByRole("list", { name: "Orders on this page" }).getAttribute("aria-busy")).toBe(
      "true",
    );
    expect(disabled(pager.getByRole("button", { name: "Previous" }))).toBe(true);
    advance(600);
    expect(orders()[0]).toBe("Order 1011");
    expect(screen.getByTestId("cursor").textContent).toBe("Cursor: 10");
    expect(disabled(pager.getByRole("button", { name: "Previous" }))).toBe(false);

    press(pager.getByRole("button", { name: "Previous" }));
    advance(600);
    expect(orders()[0]).toBe("Order 1001");
    expect(screen.getByTestId("cursor").textContent).toBe("Cursor: 0");
  });

  it("ends the live pager on a short last page with next disabled", () => {
    renderPage();
    const live = section("Try it");
    const pager = nav(live, "Orders, paged");
    for (let step = 0; step < 4; step += 1) {
      press(pager.getByRole("button", { name: "Next" }));
      advance(600);
    }
    expect(screen.getByTestId("cursor").textContent).toBe("Cursor: 40");
    expect(disabled(pager.getByRole("button", { name: "Next" }))).toBe(true);
    expect(pager.getByRole("status").textContent).toBe("Showing 5 items");
  });

  it("grows the live list by one page per press and keeps the button, disabled, at the end", () => {
    renderPage();
    const live = section("Try it");
    const growing = nav(live, "Orders, growing");
    const count = () =>
      within(live.getByRole("list", { name: "Orders loaded so far" })).getAllByRole("listitem")
        .length;
    expect(count()).toBe(10);
    press(growing.getByRole("button", { name: "Load more" }));
    advance(600);
    expect(count()).toBe(20);
    expect(growing.getByRole("status").textContent).toBe("Showing 20 items");
    for (let step = 0; step < 3; step += 1) {
      press(growing.getByRole("button", { name: "Load more" }));
      advance(600);
    }
    expect(count()).toBe(45);
    // The button stays mounted, so focus on it is not lost when the last page arrives.
    expect(disabled(growing.getByRole("button", { name: "Load more" }))).toBe(true);
  });
});
