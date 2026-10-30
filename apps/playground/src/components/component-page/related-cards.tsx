/**
 * Stackra file contract:
 * Purpose: `RelatedCards`, the up to three related entries at the foot of a page, as the showcase's component cards
 *          (live mini preview, status and tier chips, link to the page).
 * Boundary: resolves the registry keys; the card is `components/component-card` (WP4).
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 4 (row 11) and 5.
 */
import { bySlug, type ComponentTier, webPath } from "@stackra/showcase";

import { ComponentCard } from "#src/components/component-card";
import type { SectionProps } from "#src/components/component-page/section.props";

/** The related entries of `entry`. */
export function RelatedCards({ entry }: Pick<SectionProps, "entry">) {
  const related = entry.related.flatMap((key) => {
    const [tier, slug] = key.split("/") as [ComponentTier, string];
    const found = bySlug(tier, slug);
    return found ? [found] : [];
  });
  if (related.length === 0) return null;
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))] gap-4">
      {related.map((item) => (
        <li key={webPath(item)}>
          <ComponentCard entry={item} />
        </li>
      ))}
    </ul>
  );
}
