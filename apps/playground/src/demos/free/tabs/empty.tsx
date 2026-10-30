/**
 * Stackra file contract:
 * Purpose: the "empty" demo of the web Tabs: the empty state and the loading state.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0313.
 */
import { Tabs, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TABS_KEYS } from "#src/routes/tabs/tabs-keys.constant";

/** The demo's keys. */
const K = TABS_KEYS.tabs.empty;

/** Empty and loading. */
export default function Empty() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="flex flex-wrap items-start gap-8">
      <Tabs items={[]} emptyState={<Text tone="muted">{t(K.message)}</Text>} />
      <Tabs items={[]} isLoading loadingLabel={t(K.loading)} />
    </div>
  );
}
