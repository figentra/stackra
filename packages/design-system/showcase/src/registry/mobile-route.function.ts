/**
 * Stackra file contract:
 * Purpose: `mobileRoute`, the mobile navigation target of an entry: the one `Component` route with its params.
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.2.
 */
import type { DocTab } from "#src/enums/doc-tab.enum";
import type { ComponentEntry } from "#src/types/component-entry.type";
import type { MobileComponentParams } from "#src/types/mobile-component-params.type";

/** `{ name: "Component", params: { tier, slug, tab?, example? } }` for `entry`. */
export function mobileRoute(
  entry: Pick<ComponentEntry, "tier" | "slug">,
  tab?: DocTab,
  example?: string,
): { readonly name: "Component"; readonly params: MobileComponentParams } {
  return {
    name: "Component",
    params: {
      tier: entry.tier,
      slug: entry.slug,
      ...(tab ? { tab } : {}),
      ...(example ? { example } : {}),
    },
  };
}
