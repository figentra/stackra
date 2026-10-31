/**
 * Stackra file contract:
 * Purpose: `RESERVED_SHORTCUTS`, the bindings a browser or the operating system keeps (close tab, new window, reload,
 *          address bar, zoom, quit, switch app), which no action may take.
 * Boundary: data only, in normal form; the conflict detector reports a binding that equals one as `reserved`.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (reserved keys are refused).
 */

/** The reserved bindings. */
export const RESERVED_SHORTCUTS: readonly string[] = Object.freeze([
  "mod+w",
  "mod+t",
  "mod+n",
  "mod+q",
  "mod+r",
  "mod+l",
  "mod+h",
  "mod+m",
  "mod+0",
  "mod+=",
  "mod+-",
  "mod+tab",
  "mod+shift+t",
  "mod+shift+n",
  "mod+shift+w",
  "mod+shift+q",
  "ctrl+tab",
  "ctrl+shift+tab",
  "alt+f4",
  "alt+tab",
  "f5",
  "f11",
  "f12",
]);
