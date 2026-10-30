/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Navigation list: A disabled entry is dimmed and refuses the pointer and the
 *          keyboard. An entry with only a press action is a link that runs the action; the page counts the presses.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.7 and 4.1.2.
 */
import { NavigationList as UiNavigationList, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { useLocation } from "react-router";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { NAVIGATION_LIST_KEYS } from "#src/demos/free/navigation-list/navigation-list-keys.constant";

/** The demo's keys. */
const K = NAVIGATION_LIST_KEYS.navigation_list;

/** Navigation list: Disabled and press-only. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  const [presses, setPresses] = useState(0);

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;

  const anchor = (id: string) => `${here}#${id}`;

  return (
    <div className="grid max-w-xs gap-3">
      <UiNavigationList
        label={t(K.states_label)}
        items={[
          {
            id: "home",
            label: t(K.home),
            href: anchor("navigation-list-states"),
            icon: Icons.House,
          },
          {
            id: "archive",
            label: t(K.archive),
            href: anchor("navigation-list-states"),
            icon: Icons.Package,
            isDisabled: true,
          },
          {
            id: "report",
            label: t(K.run_report),
            icon: Icons.Users,
            onPress: () => setPresses((count) => count + 1),
          },
        ]}
      />
      <output aria-live="polite" data-testid="press-count">
        <bdi>{t(K.press_count, { count: presses })}</bdi>
      </output>
    </div>
  );
}
