/**
 * Stackra file contract:
 * Purpose: the "channels" demo of the web Overflow list: a product's sales channels, expanded at the start; a long branch name with a Latin code truncates inside its chip.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          design-system gap inventory (2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { OverflowList, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { OVERFLOW_LIST_KEYS } from "#src/demos/free/overflow-list/overflow-list-keys.constant";

/** The demo's keys. */
const K = OVERFLOW_LIST_KEYS.overflow_list.channels;

/** The channels a product sells on. */
const CHANNELS = ["online", "pos", "marketplace", "wholesale", "kiosk"] as const;

/** Overflow list: Sales channels. */
export default function Channels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <OverflowList
      label={t(K.label)}
      items={CHANNELS.map((id) => ({ id, label: t(K[id]) }))}
      maxVisible={2}
      defaultExpanded
      className="max-w-xs"
    />
  );
}
