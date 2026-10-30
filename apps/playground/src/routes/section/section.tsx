/**
 * Stackra file contract:
 * Purpose: the page of the section route: the generic component page of the registry entry `free/section`.
 * Boundary: one line; the sections, demos and API come from `components/component-page` and `demos/`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0302 (decision 5).
 */
import { ComponentPage } from "#src/components/component-page";

/** The section page. */
export default function Page() {
  return <ComponentPage tier="free" slug="section" />;
}
