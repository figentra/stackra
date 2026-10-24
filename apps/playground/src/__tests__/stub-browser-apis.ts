/**
 * Stackra file contract:
 * Purpose: the browser APIs the HeroUI Pro pages need and jsdom lacks, for the unit tests of the Pro routes:
 *          `matchMedia` (HeroUI Pro's Sheet reads it as its module loads, so importing this file first stubs it before
 *          any page is imported) and `ResizeObserver` (the grid, the scroll shadow and the sidebar observe their
 *          boxes through it).
 * Boundary: test support only; importing it stubs once, and a test calls `stubBrowserApis` in `beforeEach`, since the
 *          vitest preset restores stubbed globals after each test.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */

/** Stubs `matchMedia` (never matching) and `ResizeObserver` (never observing) on the global scope. */
export function stubBrowserApis(): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}

stubBrowserApis();
