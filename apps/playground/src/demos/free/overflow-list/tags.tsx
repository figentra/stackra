/**
 * Stackra file contract:
 * Purpose: the "tags" demo of the web Overflow list: a menu item's dietary tags; three show and the rest fold into “+3 more”, whose tooltip names them.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          design-system gap inventory (2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { OverflowList, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { OVERFLOW_LIST_KEYS } from "#src/demos/free/overflow-list/overflow-list-keys.constant";

/** The demo's keys. */
const K = OVERFLOW_LIST_KEYS.overflow_list.tags;

/** The tags of one dish. */
const TAGS = ["vegan", "spicy", "gluten_free", "halal", "new", "best_seller"] as const;

/** Overflow list: Product tags. */
export default function Tags() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <OverflowList
      label={t(K.label)}
      items={TAGS.map((id) => ({ id, label: t(K[id]) }))}
      className="max-w-sm"
    />
  );
}
