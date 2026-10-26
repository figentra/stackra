/**
 * Stackra file contract:
 * Purpose: `SurfaceKind`, the surfaces a product contributes to in its root runway's `surfaces` block: the console,
 *          the landing site, the ops console, the till, the shopper app and the kiosk.
 * Boundary: an `Enum.of` value plus the type of the same name. Which shell serves a surface, and on which host, is
 *           runway data; the OS owns the console, ops and landing shells, the commerce product the till and shopper
 *           templates (kiosk is a till mode).
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decisions 1 and 2), ADR 0441 (decision 3), ADR 0442 (decisions 2 and 9).
 */
import { Enum } from "@stackra/contracts";

/** One case per surface key. */
export const SurfaceKind = Enum.of({
  /** The tenant console shell (`console.<product>.<zone>`). */
  Console: "console",
  /** The landing site, from experience documents (`<product>.<zone>`). */
  Landing: "landing",
  /** Figentra staff's one ops console; a product only `contributes` declarations to it. */
  Ops: "ops",
  /** The commerce till template. */
  Till: "till",
  /** The commerce shopper template. */
  Shopper: "shopper",
  /** The till's kiosk mode, on a host of its own. */
  Kiosk: "kiosk",
});

/** One of the codes above. */
export type SurfaceKind = Enum.Value<typeof SurfaceKind>;
