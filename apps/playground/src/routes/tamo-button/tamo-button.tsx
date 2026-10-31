/**
 * Stackra file contract:
 * Purpose: the page of the tamo-button route: the generic component page of the registry entry `free/tamo-button`.
 * Boundary: one line; the sections, demos and API come from `components/component-page` and `demos/`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0302 (decision 5); ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import { ComponentPage } from "#src/components/component-page";

/** The tamo-button page. */
export default function Page() {
  return <ComponentPage tier="free" slug="tamo-button" />;
}
