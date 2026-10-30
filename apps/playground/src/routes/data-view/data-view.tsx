/**
 * Stackra file contract:
 * Purpose: the page of the data-view route: the generic component page of the registry entry `free/data-view`.
 * Boundary: one line; the sections, demos and API come from `components/component-page` and `demos/`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0302 (decision 5).
 */
import { ComponentPage } from "#src/components/component-page";

/** The data-view page. */
export default function Page() {
  return <ComponentPage tier="free" slug="data-view" />;
}
