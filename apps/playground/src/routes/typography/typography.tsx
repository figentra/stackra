/**
 * Stackra file contract:
 * Purpose: the page of the typography route: the generic component page of the registry entry `free/typography`.
 * Boundary: the generic page with its own lead block (STA-1371); the sections, demos and API come from `components/component-page` and `demos/`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0302 (decision 5).
 */
import { ComponentPage } from "#src/components/component-page";
import { TypographySpecimen } from "#src/components/doc-page/typography-specimen";

/** The typography page. */
export default function Page() {
  return <ComponentPage tier="free" slug="typography" lead={<TypographySpecimen />} />;
}
