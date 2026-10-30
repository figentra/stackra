/**
 * Stackra file contract:
 * Purpose: the page of the floating panel route: the generic component page of the registry entry `free/floating-panel`.
 * Boundary: one line; the sections, demos and API come from `components/component-page` and `demos/`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0302 (decision 5).
 */
import { ComponentPage } from "#src/components/component-page";

/** The floating panel page. */
export default function Page() {
  return <ComponentPage tier="free" slug="floating-panel" />;
}
