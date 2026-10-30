/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Swipeable tabs: order statuses whose panels also change with a touch swipe.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { SwipeableTabs, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SWIPEABLE_TABS_KEYS } from "#src/demos/free/swipeable-tabs/swipeable-tabs-keys.constant";

/** The demo's keys. */
const K = SWIPEABLE_TABS_KEYS.swipeable_tabs;

/** Swipeable tabs: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const panel = (body: string) => (
    <div className="grid gap-2 py-4">
      <Text>{body}</Text>
      <Text type="caption" tone="muted">
        {t(K.hint)}
      </Text>
    </div>
  );
  return (
    <SwipeableTabs
      label={t(K.label)}
      className="w-full max-w-md"
      items={[
        { id: "new", label: t(K.new), content: panel(t(K.new_body)) },
        { id: "preparing", label: t(K.preparing), content: panel(t(K.preparing_body)) },
        { id: "ready", label: t(K.ready), content: panel(t(K.ready_body)) },
      ]}
    />
  );
}
