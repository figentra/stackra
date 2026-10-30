/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Navigation list: A right-to-left list: the icons and the current mark sit at
 *          the right.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.7 and 4.1.2.
 */
import { NavigationList as UiNavigationList, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { NAVIGATION_LIST_KEYS } from "#src/demos/free/navigation-list/navigation-list-keys.constant";

/** The demo's keys. */
const K = NAVIGATION_LIST_KEYS.navigation_list;

/** Navigation list: Arabic. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;

  const anchor = (id: string) => `${here}#${id}`;

  return (
    <div lang="ar" dir="rtl" className="max-w-xs">
      <UiNavigationList
        label={t(K.arabic_label)}
        items={[
          {
            id: "home",
            label: t(K.arabic_home),
            href: anchor("navigation-list-arabic"),
            icon: Icons.House,
          },
          {
            id: "orders",
            label: t(K.arabic_orders),
            href: anchor("navigation-list-arabic"),
            icon: Icons.Package,
            isCurrent: true,
          },
          {
            id: "customers",
            label: t(K.arabic_customers),
            href: anchor("navigation-list-arabic"),
            icon: Icons.Users,
          },
        ]}
      />
    </div>
  );
}
