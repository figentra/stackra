/**
 * Stackra file contract:
 * Purpose: `Icons`, the names of the `@stackra/icons` icons the playground pages pass to an `icon` position.
 * Boundary: names only; the drawing each name resolves to is the icon registry's.
 * Runtime: browser
 * Governing contract: owner decision R-56 (generated key constants); ADR 0322; ADR 0303 (decision 10).
 */
import type { IconName } from "@stackra/icons/contracts";

/** The icon names this app draws, by constant, so an `icon` position never takes a raw literal. */
// shortcut: written by hand until gen emits the app's `Icons` constant (STA-339); then import that one instead.
export const Icons = Object.freeze({
  Archive: "archive",
  CircleCheck: "circle-check",
  Copy: "copy",
  Download: "download",
  ExternalLink: "external-link",
  House: "house",
  Inbox: "inbox",
  LayoutGrid: "layout-grid",
  LifeBuoy: "life-buoy",
  Monitor: "monitor",
  Package: "package",
  Palette: "palette",
  Pencil: "pencil",
  Plus: "plus",
  Server: "server",
  Smartphone: "smartphone",
  Sparkles: "sparkles",
  Tablet: "tablet",
  Trash: "trash",
  Users: "users",
} as const satisfies Readonly<Record<string, IconName>>);
