/**
 * Stackra file contract:
 * Purpose: the page of the icon route: the generic component page of the registry entry `free/icon`.
 * Boundary: the generic page with its own lead block (STA-1371); the sections, demos and API come from `components/component-page` and `demos/`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0302 (decision 5).
 */
import { ComponentPage } from "#src/components/component-page";
import { IconSearch } from "#src/components/doc-page/icon-search";

/** The icon page. */
export default function Page() {
  return <ComponentPage tier="free" slug="icon" lead={<IconSearch />} />;
}
