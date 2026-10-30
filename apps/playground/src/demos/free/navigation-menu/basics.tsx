/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web NavigationMenu: a store site's top bar with two panels of links and a plain
 *          link; the online store is the current page.
 * Boundary: a demo with no props, @stackra/ui only; links point at `#` anchors. The same file is the preview and the
 *           code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { NavigationMenu, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { NAVIGATION_MENU_KEYS } from "#src/demos/free/navigation-menu/navigation-menu-keys.constant";

/** The demo's keys. */
const K = NAVIGATION_MENU_KEYS.navigation_menu.basics;

/** NavigationMenu: panels and a link. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="min-h-64 w-full">
      <NavigationMenu
        label={t(K.label)}
        items={[
          {
            id: "products",
            label: t(K.products),
            children: [
              { id: "pos", label: t(K.pos), description: t(K.pos_note), href: "#pos" },
              {
                id: "store",
                label: t(K.store),
                description: t(K.store_note),
                href: "#store",
                isCurrent: true,
              },
              {
                id: "payments",
                label: t(K.payments),
                description: t(K.payments_note),
                href: "#payments",
              },
            ],
          },
          {
            id: "resources",
            label: t(K.resources),
            children: [
              { id: "guides", label: t(K.guides), description: t(K.guides_note), href: "#guides" },
              { id: "help", label: t(K.help), description: t(K.help_note), href: "#help" },
            ],
          },
          { id: "pricing", label: t(K.pricing), href: "#pricing" },
        ]}
      />
    </div>
  );
}
