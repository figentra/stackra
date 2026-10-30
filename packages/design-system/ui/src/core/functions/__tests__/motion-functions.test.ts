/**
 * Stackra file contract:
 * Purpose: proves the motion helpers: `resolveMotion` lowers only `full` under the system setting; `viewStackKeyframes`
 *          slides a push from the reading end (mirrored in right-to-left and on the way back), drifts the old view a
 *          third under `push-parallax`, fades at `reduced` and plays nothing at `none`; `nativeStackAnimationOf` picks
 *          the side by direction; `tweenNumber` eases to the exact end value and can be stopped; `revealWordsOf` splits on
 *          spaces but keeps a mixed-direction text whole.
 * Boundary: pure functions; `requestAnimationFrame` is a stand-in driven by hand.
 * Runtime: node
 * Governing contract: ADR 0329 (motion layer); ADR 0060 (right-to-left); ADR 0022 (test placement).
 */
import { nativeStackAnimationOf } from "#core/functions/native-stack-animation-of.function";
import { resolveMotion } from "#core/functions/resolve-motion.function";
import { revealWordsOf } from "#core/functions/reveal-words-of.function";
import { tickerValueOf } from "#core/functions/ticker-value-of.function";
import { tweenNumber } from "#core/functions/tween-number.function";
import { viewStackKeyframes } from "#core/functions/view-stack-keyframes.function";

describe("resolveMotion", () => {
  it("lowers full to reduced under the system setting and never raises a level", () => {
    expect(resolveMotion("full", false)).toBe("full");
    expect(resolveMotion("full", true)).toBe("reduced");
    expect(resolveMotion("reduced", false)).toBe("reduced");
    expect(resolveMotion("none", true)).toBe("none");
  });
});

describe("viewStackKeyframes", () => {
  it("slides a push in from the reading end, mirrored in right-to-left", () => {
    expect(viewStackKeyframes("push", "forward", "ltr", "full")?.entering[0]?.transform).toBe(
      "translateX(100%)",
    );
    expect(viewStackKeyframes("push", "forward", "rtl", "full")?.entering[0]?.transform).toBe(
      "translateX(-100%)",
    );
  });

  it("mirrors the push on the way back", () => {
    const back = viewStackKeyframes("push", "back", "ltr", "full");
    expect(back?.leaving.at(-1)?.transform).toBe("translateX(100%)");
    expect(back?.entering[0]?.transform).toBe("translateX(-100%)");
  });

  it("drifts the old view a third of the way under push-parallax", () => {
    const frames = viewStackKeyframes("push-parallax", "forward", "ltr", "full");
    expect(frames?.leaving.at(-1)).toEqual({ transform: "translateX(-30%)", opacity: 0.7 });
  });

  it("drops from-top in from above, over a still view, and lifts it off going back", () => {
    const forward = viewStackKeyframes("from-top", "forward", "ltr", "full");
    expect(forward?.entering[0]?.transform).toBe("translateY(-100%)");
    expect(forward?.leaving).toEqual([{ opacity: 1 }, { opacity: 1 }]);
    expect(viewStackKeyframes("from-top", "back", "ltr", "full")?.leaving.at(-1)?.transform).toBe(
      "translateY(-100%)",
    );
  });

  it("fades at reduced and plays nothing at none or for none", () => {
    // A hand-over, not a cross-fade: the old view is gone by halfway, the new one starts there.
    const fade = viewStackKeyframes("push", "forward", "ltr", "reduced");
    expect(fade?.leaving).toEqual([{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }]);
    expect(fade?.entering).toEqual([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }]);
    expect(viewStackKeyframes("push", "forward", "ltr", "none")).toBeUndefined();
    expect(viewStackKeyframes("none", "forward", "ltr", "full")).toBeUndefined();
  });
});

describe("nativeStackAnimationOf", () => {
  it("pushes from the reading end and falls back to fade or none", () => {
    expect(nativeStackAnimationOf("push", "ltr")).toBe("slide_from_right");
    expect(nativeStackAnimationOf("push", "rtl")).toBe("slide_from_left");
    expect(nativeStackAnimationOf("push-parallax", "rtl")).toBe("ios_from_left");
    expect(nativeStackAnimationOf("from-top", "ltr")).toBe("fade");
    expect(nativeStackAnimationOf("push", "ltr", "reduced")).toBe("fade");
    expect(nativeStackAnimationOf("push", "ltr", "none")).toBe("none");
  });
});

describe("tweenNumber", () => {
  const frames: ((time: number) => void)[] = [];
  beforeEach(() => {
    frames.length = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: (time: number) => void) =>
      frames.push(callback),
    );
    vi.stubGlobal("cancelAnimationFrame", () => {
      frames.length = 0;
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("eases from the start to the exact end value", () => {
    const values: number[] = [];
    tweenNumber(0, 100, 1000, (value) => values.push(value));
    for (const time of [0, 500, 1000]) frames.shift()?.(time);
    expect(values[0]).toBe(0);
    expect(values[1]).toBeCloseTo(87.5);
    expect(values.at(-1)).toBe(100);
    expect(frames).toHaveLength(0);
  });

  it("jumps to the end for no duration and stops when asked", () => {
    const values: number[] = [];
    tweenNumber(0, 5, 0, (value) => values.push(value));
    expect(values).toEqual([5]);
    const stop = tweenNumber(0, 5, 1000, (value) => values.push(value));
    stop();
    expect(frames).toHaveLength(0);
  });
});

describe("revealWordsOf", () => {
  it("splits one script on spaces and keeps a mixed-direction text whole", () => {
    expect(revealWordsOf("  One   system, every screen ")).toEqual([
      "One",
      "system,",
      "every",
      "screen",
    ]);
    expect(revealWordsOf("بنية واحدة. وتجربة متّسقة")).toEqual([
      "بنية",
      "واحدة.",
      "وتجربة",
      "متّسقة",
    ]);
    expect(revealWordsOf("نظام Stackra الموحّد")).toEqual(["نظام Stackra الموحّد"]);
    expect(revealWordsOf("   ")).toEqual([]);
  });
});

describe("tickerValueOf", () => {
  it("rounds a count between whole numbers and keeps fractions when asked for them", () => {
    expect(tickerValueOf(41.6, 0, 100, undefined)).toBe(42);
    expect(tickerValueOf(41.6, 0, 99.5, undefined)).toBe(41.6);
    expect(tickerValueOf(41.6, 0, 100, { maximumFractionDigits: 1 })).toBe(41.6);
  });
});
