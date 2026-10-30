/**
 * Stackra file contract:
 * Purpose: `contractUrl`, the GitHub page of an entry's shared contract props type.
 * Boundary: a pure function; the one docs URL that is derived (spec section 6, last row), the HeroUI ones are data.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 6.
 */
import type { ComponentEntry } from "@stackra/showcase";

const REPOSITORY = "https://github.com/figentra/stackra/blob/main/packages/design-system";

/** The URL of `<slug>-contract-props.type.ts` of `entry`. */
export function contractUrl(entry: Pick<ComponentEntry, "slug">): string {
  return `${REPOSITORY}/ui/src/contracts/types/${entry.slug}-contract-props.type.ts`;
}
