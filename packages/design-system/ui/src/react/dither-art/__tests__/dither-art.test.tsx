/**
 * Stackra file contract:
 * Purpose: proves the web DitherArt is hidden decoration that nothing can focus, keeps its poster under the canvas,
 *          draws the pattern at cell resolution in the three token colours, drifts at full motion and stands still
 *          under reduced motion or `speed={0}`, holds after under five seconds of drift, picks a poster per scheme,
 *          draws the same in right-to-left (a dot field mirrors as a whole, glyphs never), and that the ported dither
 *          puts the strata's core at the base and none at the top. The `glyphs` mode draws lit cells as characters
 *          from its set at the cell size, `sun` moves the core glow while the kit's own centre stays the default, and a
 *          glyph field moves a given sun to the other side in right-to-left.
 * Boundary: jsdom has no canvas or layout, so `getContext`, the element's size and `requestAnimationFrame` are
 *           recording stand-ins, and the `rtl:` mirror is a class, not a transform jsdom runs; `useReducedMotion` is
 *           stubbed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); brand rules §40; WCAG 2.2 SC 2.2.2; STA-2041.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { DITHER_FIELDS } from "#core/constants/dither-fields.constant";
import { ditherTone } from "#core/functions/dither-tone.function";
import { DitherArt } from "#react/dither-art/dither-art";

const state = vi.hoisted(() => ({ isReduced: false }));
vi.mock("motion/react", () => ({ useReducedMotion: () => state.isReduced }));

const fills: string[] = [];
const texts: string[] = [];
const context = {
  fillStyle: "",
  font: "",
  textAlign: "",
  textBaseline: "",
  fillRect: vi.fn(function (this: { fillStyle: string }) {
    fills.push(this.fillStyle);
  }),
  fillText: vi.fn((text: string) => {
    texts.push(text);
  }),
};
const frame = vi.fn((_callback: FrameRequestCallback) => 1);

/** The strata's tones along one row of a 64 × 32 grid. */
const tones = (row: number) =>
  Array.from({ length: 64 }, (_, i) => ditherTone("strata", i, row, 64, 32));

/** The strata's tones along the top row of a 64 × 32 grid, the core glow at `sun` when given. */
const top = (sun?: { x: number; y: number }) =>
  Array.from({ length: 64 }, (_, i) => ditherTone("strata", i, 0, 64, 32, 0, sun));

/** The cells a still glyph field draws a character at, in any order, with its sun at `x` from the inline start. */
const glyphCells = (x: number, locale: string) => {
  context.fillText.mockClear();
  render(
    <I18nProvider locale={locale}>
      <DitherArt poster="/p.png" mode="glyphs" pixelSize={2} speed={0} sun={{ x, y: 0.5 }} />
    </I18nProvider>,
  );
  const calls = context.fillText.mock.calls as unknown as readonly [string, number, number][];
  return calls.map(([, i, j]) => `${String(i)}:${String(j)}`).sort();
};

describe("DitherArt (web)", () => {
  beforeEach(() => {
    state.isReduced = false;
    fills.length = 0;
    texts.length = 0;
    vi.clearAllMocks();
    vi.stubGlobal("requestAnimationFrame", frame);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: () => context,
      configurable: true,
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { value: 64, configurable: true });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { value: 32, configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is hidden decoration over its poster, with nothing to focus", () => {
    const { container } = render(<DitherArt poster="/strata-dark.png" />);
    const art = container.querySelector('[data-slot="dither-art"]');
    expect(art?.getAttribute("aria-hidden")).toBe("true");
    expect(art?.querySelector("img")?.getAttribute("src")).toBe("/strata-dark.png");
    expect(art?.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(container.querySelectorAll("[tabindex], button, a")).toHaveLength(0);
  });

  it("draws at cell resolution and drifts at full motion", () => {
    const { container } = render(<DitherArt poster="/p.png" pixelSize={4} />);
    const canvas = container.querySelector("canvas");
    expect(canvas?.width).toBe(16);
    expect(canvas?.height).toBe(8);
    // The ground first, over the whole canvas.
    expect(context.fillRect).toHaveBeenNthCalledWith(1, 0, 0, 16, 8);
    expect(canvas?.className).toContain("opacity-100");
    expect(frame).toHaveBeenCalled();
  });

  it("stands still under reduced motion and at speed 0", () => {
    state.isReduced = true;
    render(<DitherArt poster="/p.png" />);
    expect(context.fillRect).toHaveBeenCalled();
    expect(frame).not.toHaveBeenCalled();
    state.isReduced = false;
    render(<DitherArt poster="/p.png" speed={0} />);
    expect(frame).not.toHaveBeenCalled();
  });

  it("draws the same in right-to-left, where a dot field mirrors as a whole and glyphs never do", () => {
    const { container } = render(<DitherArt poster="/p.png" pattern="lanes" speed={0} />);
    const ltr = [...fills];
    fills.length = 0;
    render(
      <I18nProvider locale="ar">
        <DitherArt poster="/p.png" pattern="lanes" speed={0} />
      </I18nProvider>,
    );
    expect(fills).toEqual(ltr);
    expect(container.querySelector('[data-slot="dither-art"]')?.className).toContain(
      "rtl:-scale-x-100",
    );
    const glyphs = render(<DitherArt poster="/p.png" mode="glyphs" speed={0} />);
    expect(glyphs.container.querySelector('[data-slot="dither-art"]')?.className).not.toContain(
      "scale-x",
    );
  });

  it("moves a glyph field's sun to the other side in right-to-left", () => {
    const end = glyphCells(0.8, "en");
    expect(end.length).toBeGreaterThan(0);
    expect(glyphCells(0.2, "ar")).toEqual(end);
  });

  it("holds its last frame before five seconds of drift (WCAG 2.2.2)", () => {
    render(<DitherArt poster="/p.png" />);
    const tick = frame.mock.calls.at(-1)?.[0];
    if (!tick) throw new Error("no frame requested");
    frame.mockClear();
    tick(performance.now() + 1000);
    expect(frame).toHaveBeenCalledTimes(1);
    frame.mockClear();
    tick(performance.now() + 5000);
    expect(frame).not.toHaveBeenCalled();
  });

  it("shows the dark poster of a pair by default", () => {
    const { container } = render(
      <DitherArt poster={{ light: "/l.png", dark: "/d.png" }} speed={0} />,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/d.png");
  });

  it("puts the strata's core at the base and none at the top", () => {
    expect(tones(31)).toContain(2);
    expect(tones(0)).not.toContain(2);
  });

  it("draws lit cells as glyphs from its set at the cell size, still under reduced motion", () => {
    state.isReduced = true;
    const { container } = render(
      <DitherArt poster="/p.png" pattern="core" mode="glyphs" glyphs="{}" pixelSize={8} />,
    );
    const canvas = container.querySelector("canvas");
    // Device pixels, not cells: 64 × 32 CSS pixels at a device pixel ratio of 1.
    expect(canvas?.width).toBe(64);
    expect(canvas?.height).toBe(32);
    expect(canvas?.className).not.toContain("pixelated");
    expect(context.font).toBe("8px monospace");
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.every((text) => text === "{" || text === "}")).toBe(true);
    // Only the ground is a rectangle.
    expect(context.fillRect).toHaveBeenCalledTimes(1);
    expect(frame).not.toHaveBeenCalled();
  });

  it("moves the core glow to the sun and keeps the kit's centre by default", () => {
    expect(top({ x: 0.5, y: 0 })).toContain(2);
    expect(top()).not.toContain(2);
    for (const pattern of ["strata", "core", "grid", "lanes"] as const)
      expect(DITHER_FIELDS[pattern](0.4, 0.7, 3, 2)).toEqual(
        DITHER_FIELDS[pattern](0.4, 0.7, 3, 2, undefined),
      );
    expect(DITHER_FIELDS.strata(0.3, 0.9, 0, 2)).toEqual(
      DITHER_FIELDS.strata(0.3, 0.9, 0, 2, { x: 0.5, y: 1.04 }),
    );
    expect(DITHER_FIELDS.grid(0.8, 0.4, 0, 2)).toEqual(
      DITHER_FIELDS.grid(0.8, 0.4, 0, 2, { x: 0.9, y: 0.5 }),
    );
  });

  it("passes the sun to the canvas draw", () => {
    render(<DitherArt poster="/p.png" pixelSize={4} speed={0} />);
    const kit = [...context.fillRect.mock.calls];
    context.fillRect.mockClear();
    render(<DitherArt poster="/p.png" pixelSize={4} speed={0} sun={{ x: 0.5, y: 0 }} />);
    // The lit cells sit elsewhere: the glow left the base for the top.
    expect(context.fillRect.mock.calls).not.toEqual(kit);
  });
});
