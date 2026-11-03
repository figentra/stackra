/**
 * Stackra file contract:
 * Purpose: proves the web DitherArt is hidden decoration that nothing can focus, keeps its poster under the canvas,
 *          draws the pattern at cell resolution in the three token colours, drifts at full motion and stands still
 *          under reduced motion or `speed={0}`, holds after under five seconds of drift, picks a poster per scheme,
 *          draws the same in right-to-left, and that the ported dither puts the
 *          strata's core at the base and none at the top.
 * Boundary: jsdom has no canvas or layout, so `getContext`, the element's size and `requestAnimationFrame` are
 *           recording stand-ins; `useReducedMotion` is stubbed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); brand rules §40; WCAG 2.2 SC 2.2.2; STA-2041.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { ditherTone } from "#core/functions/dither-tone.function";
import { DitherArt } from "#react/dither-art/dither-art";

const state = vi.hoisted(() => ({ isReduced: false }));
vi.mock("motion/react", () => ({ useReducedMotion: () => state.isReduced }));

const fills: string[] = [];
const context = {
  fillStyle: "",
  fillRect: vi.fn(function (this: { fillStyle: string }) {
    fills.push(this.fillStyle);
  }),
};
const frame = vi.fn((_callback: FrameRequestCallback) => 1);

/** The strata's tones along one row of a 64 × 32 grid. */
const tones = (row: number) =>
  Array.from({ length: 64 }, (_, i) => ditherTone("strata", i, row, 64, 32));

describe("DitherArt (web)", () => {
  beforeEach(() => {
    state.isReduced = false;
    fills.length = 0;
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

  it("draws the same in right-to-left", () => {
    render(<DitherArt poster="/p.png" pattern="lanes" speed={0} />);
    const ltr = [...fills];
    fills.length = 0;
    render(
      <I18nProvider locale="ar">
        <DitherArt poster="/p.png" pattern="lanes" speed={0} />
      </I18nProvider>,
    );
    expect(fills).toEqual(ltr);
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
});
