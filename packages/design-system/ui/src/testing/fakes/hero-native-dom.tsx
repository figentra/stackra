/**
 * Stackra file contract:
 * Purpose: `heroNativeDom`, a stand-in of `heroui-native`: every capitalised export (and its `.Part`s) is a `div` that
 *          passes its children through.
 * Boundary: test-only; used as `vi.mock("heroui-native", async () => (await import("#testing/fakes/hero-native-dom")).heroNativeDom)`.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0305 (one declaration per file); STA-1371.
 */
import { domOf } from "#testing/fakes/dom-of.function";

/** A `div` component whose capitalised members are `div` components too (`Slider.Track`). */
const part = (): unknown =>
  new Proxy(domOf("div"), {
    get: (target, key) =>
      typeof key === "string" && /^[A-Z]/.test(key)
        ? part()
        : (target as unknown as Record<string | symbol, unknown>)[key],
  });

/** The `heroui-native` stand-in: every capitalised export is a pass-through `div`. */
export const heroNativeDom = new Proxy({ useThemeColor: () => "#000" } as Record<string, unknown>, {
  get: (target, key) =>
    typeof key === "string" && /^[A-Z]/.test(key) ? part() : target[key as string],
  has: () => true,
});
