/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Navigation list: Press an entry: it becomes the current place and the page
 *          reports it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.7 and 4.1.2.
 */
import type { NavigationItem } from "@stackra/ui/contracts";
import { NavigationList as UiNavigationList, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { NAVIGATION_LIST_KEYS } from "#src/demos/free/navigation-list/navigation-list-keys.constant";

/** The demo's keys. */
const K = NAVIGATION_LIST_KEYS.navigation_list;

/** Navigation list: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** The entries of the live example, each with the text the page reports when it is current. */
  const LIVE = [
    { id: "home", label: t(K.home), icon: Icons.House },
    { id: "orders", label: t(K.orders), icon: Icons.Package },
    { id: "customers", label: t(K.customers), icon: Icons.Users },
    { id: "inbox", label: t(K.inbox), icon: Icons.Inbox },
  ] as const;
  const [currentId, setCurrentId] = useState<string>("home");

  const live: readonly NavigationItem[] = LIVE.map((entry) => ({
    ...entry,
    isCurrent: entry.id === currentId,
    onPress: () => setCurrentId(entry.id),
  }));

  const currentName = LIVE.find((entry) => entry.id === currentId)?.label ?? t(K.home);

  return (
    <div className="grid max-w-xs gap-3">
      <UiNavigationList label={t(K.live_label)} items={live} />
      <output aria-live="polite" data-testid="current-page">
        <bdi>{t(K.current_page, { name: currentName })}</bdi>
      </output>
    </div>
  );
}
