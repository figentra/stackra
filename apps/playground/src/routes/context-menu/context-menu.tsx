/**
 * Stackra file contract:
 * Purpose: the page of the context-menu route: the generic component page of the registry entry `free/context-menu`.
 * Boundary: one line; the sections, demos and API come from `components/component-page` and `demos/`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0302 (decision 5).
 */
import { ComponentPage } from "#src/components/component-page";

/** The context-menu page. */
export default function Page() {
  return <ComponentPage tier="free" slug="context-menu" />;
}
