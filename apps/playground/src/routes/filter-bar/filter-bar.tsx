/**
 * Stackra file contract:
 * Purpose: the page of the filter-bar route: the generic component page of the registry entry `free/filter-bar`.
 * Boundary: one line; the sections, demos and API come from `components/component-page` and `demos/`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0302 (decision 5).
 */
import { ComponentPage } from "#src/components/component-page";

/** The filter-bar page. */
export default function Page() {
  return <ComponentPage tier="free" slug="filter-bar" />;
}
