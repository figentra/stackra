/**
 * Stackra file contract:
 * Purpose: `SKIA_MISSING`, the inert stand-in `loadSkia()` returns where the app has not installed
 *          `@shopify/react-native-skia` (STA-1791): a module may destructure any name from it at load, a component of
 *          it draws nothing, a function of it returns nothing, and any member read at any depth is the stand-in again.
 * Boundary: data only. It claims no `then` (so it is never awaited as a promise), no `$$typeof` or `prototype` (so React
 *           never takes it for a memo, forwardRef or class element type) and no primitive conversion.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1722 (lazy optional peers).
 */

/** Keys a caller reads to tell what a value is, which the stand-in must not claim. */
const NOT_CLAIMED: ReadonlySet<PropertyKey> = new Set([
  "then",
  "$$typeof",
  "prototype",
  Symbol.toPrimitive,
]);

/** The stand-in: callable, constructible and readable at any depth. */
export const SKIA_MISSING: unknown = new Proxy(() => null, {
  get: (_target, key) => (NOT_CLAIMED.has(key) ? undefined : SKIA_MISSING),
  apply: () => null,
  construct: () => SKIA_MISSING as object,
});
