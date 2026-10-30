/**
 * Stackra file contract:
 * Purpose: the components index route of @figentra/playground: `/components` (every category) and
 *          `/components/:category` (one), the HeroUI-style index behind the category tabs. The page it renders is
 *          `components.tsx` beside it. Its path names no registry entry, so page discovery lists it apart.
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16); showcase redesign spec (2026-10-27) section 2.2.
 */
import { Route } from "@stackra/navigation";

/** The components index, at `/components[/:category]`. */
export class ComponentsRoute extends Route({ path: "/components/:category?" }) {
  /** The router handle: the top bar lights Components here. */
  static readonly handle = { section: "components" } as const;
}
