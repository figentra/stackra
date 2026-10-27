/**
 * Stackra file contract:
 * Purpose: `DemoIcons`, the names of the demo glyphs `DemoIcon` draws, for the demo data's `icon` positions.
 * Boundary: names only; the drawing each name resolves to is the icon registry's.
 * Runtime: browser
 * Governing contract: owner decision R-56 (generated key constants); ADR 0322; ADR 0303 (decision 10).
 */
import type { DemoIconName } from "./demo-icon-name.type";

/** The icon names this app draws, by constant, so an `icon` position never takes a raw literal. */
// shortcut: written by hand until gen emits the app's `Icons` constant (STA-339); then import that one instead.
export const DemoIcons = Object.freeze({
  Chart: "chart",
  Doc: "doc",
  Gear: "gear",
  Home: "home",
  Money: "money",
  Search: "search",
  Users: "users",
} as const satisfies Readonly<Record<string, DemoIconName>>);
