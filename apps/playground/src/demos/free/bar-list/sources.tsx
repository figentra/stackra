/**
 * Stackra file contract:
 * Purpose: the "sources" demo of the web Bar list: where this week's visitors came from, each source a link.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { BarList, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BAR_LIST_KEYS } from "#src/demos/free/bar-list/bar-list-keys.constant";

/** The demo's keys. */
const K = BAR_LIST_KEYS.bar_list.sources;

/** Bar list: where this week's visitors came from, each source a link. */
export default function Sources() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <BarList
      className="w-full max-w-md"
      label={t(K.label)}
      items={[
        { key: "search", label: t(K.search), value: 12_840, href: "#search" },
        { key: "direct", label: t(K.direct), value: 8310, href: "#direct" },
        { key: "social", label: t(K.social), value: 5120, href: "#social" },
        { key: "email", label: t(K.email), value: 1975, href: "#email" },
      ]}
    />
  );
}
