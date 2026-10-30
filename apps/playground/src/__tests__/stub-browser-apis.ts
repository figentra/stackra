/**
 * Stackra file contract:
 * Purpose: the browser APIs some pages need and jsdom lacks, for the unit tests that load the real route folders:
 *          `matchMedia` (a module may read it as it loads, so importing this file first stubs it before
 *          any page is imported) and `ResizeObserver` (components observe their
 *          boxes through it).
 * Boundary: test support only; importing it stubs once, for the module loads that follow (the vitest preset restores
 *          stubbed globals after each test).
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
