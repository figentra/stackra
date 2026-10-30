/**
 * Stackra file contract:
 * Purpose: the "mega" demo of the web NavigationMenu: a back office's bar whose "Sell" panel is a two-column mega menu
 *          of links with icons and a line each.
 * Boundary: a demo with no props, @stackra/ui only; links point at `#` anchors. The same file is the preview and the
 *           code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { NavigationMenu, useCatalogueText } from "@stackra/ui/react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { NAVIGATION_MENU_KEYS } from "#src/demos/free/navigation-menu/navigation-menu-keys.constant";

/** The demo's keys. */
const B = NAVIGATION_MENU_KEYS.navigation_menu.basics;
const K = NAVIGATION_MENU_KEYS.navigation_menu.mega;

/** NavigationMenu: a two-column panel. */
export default function Mega() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="min-h-80 w-full">
      <NavigationMenu
        label={t(K.label)}
        columns={2}
        items={[
          {
            id: "sell",
            label: t(K.sell),
            children: [
              {
                id: "pos",
                label: t(B.pos),
                description: t(B.pos_note),
                icon: Icons.Store,
                href: "#pos",
              },
              {
                id: "payments",
                label: t(B.payments),
                description: t(B.payments_note),
                icon: Icons.CreditCard,
                href: "#payments",
              },
              {
                id: "shipping",
                label: t(K.shipping),
                description: t(K.shipping_note),
                icon: Icons.Truck,
                href: "#shipping",
              },
              {
                id: "invoices",
                label: t(K.invoices),
                description: t(K.invoices_note),
                icon: Icons.Receipt,
                href: "#invoices",
              },
              {
                id: "reports",
                label: t(K.reports),
                description: t(K.reports_note),
                icon: Icons.ChartColumn,
                href: "#reports",
              },
              {
                id: "store",
                label: t(B.store),
                description: t(B.store_note),
                icon: Icons.Globe,
                href: "#store",
              },
            ],
          },
          { id: "customers", label: t(K.customers), href: "#customers" },
          { id: "settings", label: t(K.settings), href: "#settings" },
        ]}
      />
    </div>
  );
}
