/**
 * Stackra file contract:
 * Purpose: `tabBarIcon(name)`, the image a native tab bar draws for a route's `IconName`: the SF Symbol that stands
 *          for that Lucide name, as `react-native-bottom-tabs` takes it (`tabBarIcon: () => tabBarIcon("house")`), so
 *          the system tab bar shows the platform's own glyph.
 * Boundary: data only, no React. The names a tab uses map to their SF Symbol; any other name draws a plain circle, so
 *           a tab is never blank on iOS.
 * Runtime: react-native
 * Governing contract: ADR 0309 (an icon is named; the platform resolves it); ADR 0302 (decision 3).
 */
import type { IconName } from "@stackra/icons/contracts";

/** The SF Symbol of each Lucide name a tab bar uses. */
const SF_SYMBOLS: Readonly<Partial<Record<IconName, string>>> = Object.freeze({
  house: "house",
  package: "shippingbox",
  settings: "gearshape",
  "shopping-cart": "cart",
  users: "person.2",
  user: "person",
  search: "magnifyingglass",
  bell: "bell",
  inbox: "tray",
  "layout-dashboard": "square.grid.2x2",
  "scan-barcode": "barcode.viewfinder",
});

// shortcut: iOS SF Symbols only; Android draws no tab image until @stackra/icons ships per-platform tab images.
/** The tab image of `name`. */
export function tabBarIcon(name: IconName): { readonly sfSymbol: string } {
  return { sfSymbol: SF_SYMBOLS[name] ?? "circle" };
}
