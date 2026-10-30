/**
 * Stackra file contract:
 * Purpose: the "channels" demo of the native OverflowList: a product's sales channels, expanded at the start, one with a Latin branch code inside Arabic text.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory (2026-10-28).
 */
import { OverflowList, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { OVERFLOW_LIST_DEMO_KEYS } from "#src/demos/free/overflow-list/overflow-list-demo-keys.constant";

/** The demo's keys. */
const K = OVERFLOW_LIST_DEMO_KEYS.demo_free.overflow_list.channels;

/** The channels a product sells on. */
const CHANNELS = ["online", "pos", "marketplace", "wholesale", "kiosk"] as const;

/** Every channel shown, with "Show less" to fold them. */
export default function Channels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <OverflowList
      label={t(K.label)}
      items={CHANNELS.map((id) => ({ id, label: t(K[id]) }))}
      maxVisible={2}
      defaultExpanded
    />
  );
}
