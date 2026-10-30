/**
 * Stackra file contract:
 * Purpose: the "tags" demo of the native OverflowList: a dish's dietary tags; three show and the rest fold into “+3 more”, hinted with their names.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory (2026-10-28).
 */
import { OverflowList, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { OVERFLOW_LIST_DEMO_KEYS } from "#src/demos/free/overflow-list/overflow-list-demo-keys.constant";

/** The demo's keys. */
const K = OVERFLOW_LIST_DEMO_KEYS.demo_free.overflow_list.tags;

/** The tags of one dish. */
const TAGS = ["vegan", "spicy", "gluten_free", "halal", "new", "best_seller"] as const;

/** Three tags and a "+3 more" that expands the row. */
export default function Tags() {
  const t = useCatalogueText(MESSAGES.en);
  return <OverflowList label={t(K.label)} items={TAGS.map((id) => ({ id, label: t(K[id]) }))} />;
}
