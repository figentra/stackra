/**
 * Stackra file contract:
 * Purpose: proves `runThemeTransition` applies the change at once without the View Transitions API or with `none`,
 *          and otherwise marks <html> with the picked preset and its origin, playing a fade under reduced motion.
 * Boundary: jsdom with a stubbed `startViewTransition` and `matchMedia`.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 11); ADR 0022 (test placement).
 */
import { runThemeTransition } from "#src/components/theme-transition";

const stubMotion = (isReduced: boolean) =>
  vi.stubGlobal("matchMedia", () => ({ matches: isReduced }));

describe("runThemeTransition", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, "startViewTransition");
    delete document.documentElement.dataset["uniwindTransition"];
  });

  it("applies the change at once without the View Transitions API", () => {
    const update = vi.fn();
    runThemeTransition(update);
    expect(update).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset["uniwindTransition"]).toBeUndefined();
  });

  it("marks the document with the preset and its origin", () => {
    stubMotion(false);
    const start = vi.fn(() => ({ finished: new Promise(() => {}) }));
    Object.assign(document, { startViewTransition: start });
    runThemeTransition(() => undefined, "circle-origin");
    expect(start).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset["uniwindTransition"]).toBe("circle-origin");
    expect(
      document.documentElement.style.getPropertyValue("--uniwind-transition-origin-x"),
    ).toMatch(/px$/);
  });

  it("plays a fade when motion is reduced, and nothing for none", () => {
    stubMotion(true);
    const start = vi.fn(() => ({ finished: new Promise(() => {}) }));
    Object.assign(document, { startViewTransition: start });
    runThemeTransition(() => undefined, "slide-rtl");
    expect(document.documentElement.dataset["uniwindTransition"]).toBe("fade");
    const update = vi.fn();
    runThemeTransition(update, "none");
    expect(update).toHaveBeenCalledOnce();
    expect(start).toHaveBeenCalledOnce();
  });
});
