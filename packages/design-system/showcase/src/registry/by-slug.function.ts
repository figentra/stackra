/**
 * Stackra file contract:
 * Purpose: `bySlug`, the entry with a tier and a slug.
 * Boundary: a pure function over the registry.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentTier } from "#src/enums/component-tier.enum";
import { COMPONENTS } from "#src/registry/components.generated";
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The entry `tier/slug`, or undefined. */
export function bySlug(
  tier: ComponentTier,
  slug: string,
  entries: readonly ComponentEntry[] = COMPONENTS,
): ComponentEntry | undefined {
  return entries.find((entry) => entry.tier === tier && entry.slug === slug);
}
