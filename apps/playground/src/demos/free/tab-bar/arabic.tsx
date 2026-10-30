/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Tab bar: in Arabic the first tab sits on the right.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { TabBar, useCatalogueText } from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { TAB_BAR_KEYS } from "#src/demos/free/tab-bar/tab-bar-keys.constant";

/** The demo's keys. */
const K = TAB_BAR_KEYS.tab_bar.arabic;

/** Tab bar: in Arabic the first tab sits on the right. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-md">
      <TabBar
        position="static"
        label={t(K.label)}
        items={[
          { id: "home", label: t(K.home), icon: Icons.House, href: "#home", isCurrent: true },
          { id: "orders", label: t(K.orders), icon: Icons.ShoppingBag, href: "#orders", badge: 3 },
          { id: "products", label: t(K.products), icon: Icons.Store, href: "#products" },
          { id: "alerts", label: t(K.alerts), icon: Icons.Bell, href: "#alerts", badge: 12 },
          { id: "settings", label: t(K.settings), icon: Icons.Settings, href: "#settings" },
        ]}
      />
    </div>
  );
}
