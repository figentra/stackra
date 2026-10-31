/**
 * Stackra file contract:
 * Purpose: the page of the pricing table route: the generic component page of the module kit entry `free/pricing-table`.
 * Boundary: one line; the sections, demos and API come from `components/component-page` and `demos/`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0302 (decision 5); ADR 0504.
 */
import { ComponentPage } from "#src/components/component-page";

/** The pricing table page. */
export default function Page() {
  return <ComponentPage tier="free" slug="pricing-table" />;
}
