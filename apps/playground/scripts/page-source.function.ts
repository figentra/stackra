/**
 * Stackra file contract:
 * Purpose: `pageSource`, the shrunk page module of a route folder: one default export that renders `ComponentPage`
 *          with the folder's tier and slug.
 * Boundary: a pure function of the shrink-routes codemod.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (generic renderers).
 */
import { tierAndSlug } from "./tier-and-slug.function";

/** The page module of `folder`. */
export function pageSource(folder: string): string {
  const { tier, slug } = tierAndSlug(folder);
  return `/**
 * Stackra file contract:
 * Purpose: the page of the ${folder} route: the generic component page of the registry entry \`${tier}/${slug}\`.
 * Boundary: one line; the sections, demos and API come from \`components/component-page\` and \`demos/\`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0302 (decision 5).
 */
import { ComponentPage } from "#src/components/component-page";

/** The ${folder} page. */
export default function Page() {
  return <ComponentPage tier="${tier}" slug="${slug}" />;
}
`;
}
