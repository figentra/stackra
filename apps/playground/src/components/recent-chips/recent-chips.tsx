/**
 * Stackra file contract:
 * Purpose: the "Recently viewed" row of the home page: the last six component pages this browser opened, as micro
 *          cards in a horizontal row; nothing when there are none.
 * Boundary: presentation over `readRecent` (localStorage, guarded); the shell writes the list on navigation.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 5 (RecentChip, web only in v1).
 */
import { byWebPath } from "@stackra/showcase";
import { Heading, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { ComponentCard } from "#src/components/component-card";
import { readRecent } from "#src/components/recent-chips/read-recent.function";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/** The recently viewed row. */
export function RecentChips() {
  const t = useCatalogueText(MESSAGES.en);
  const [entries] = useState(() =>
    readRecent()
      .map((path) => byWebPath(path))
      .filter((entry) => entry !== undefined),
  );
  if (entries.length === 0) return null;
  return (
    <section aria-labelledby="home-recent" className="grid gap-3">
      <Heading id="home-recent" level={2} type="h4">
        {t(SHOWCASE_KEYS.showcase.ui.recently_viewed)}
      </Heading>
      <ul className="flex gap-3 overflow-x-auto pb-1">
        {entries.map((entry) => (
          <li key={`${entry.tier}/${entry.slug}`} className="shrink-0">
            <ComponentCard entry={entry} size="sm" />
          </li>
        ))}
      </ul>
    </section>
  );
}
