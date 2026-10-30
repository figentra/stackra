/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Sidebar: right to left, the sidebar sits at the right with its rule on the
 *          inner side, the active bar sits on the start (right) edge, and the toggle's icon turns.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           Cmd/Ctrl+B is left to the "live" demo, so one key press does not fold every sidebar on the page.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2.
 */
import { Avatar, Sidebar, Text, useCatalogueText, useSidebar } from "@stackra/ui/react";
import { useLocation } from "react-router";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SIDEBAR_KEYS } from "#src/demos/free/sidebar/sidebar-keys.constant";

/** The demo's keys. */
const K = SIDEBAR_KEYS.sidebar;

/** The brand: a mark and its name; the mark alone in the rail. */
function Brand() {
  const t = useCatalogueText(MESSAGES.en);
  const { isRail } = useSidebar();
  return (
    <div className="flex min-w-0 items-center gap-2 px-1">
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)] bg-accent text-sm font-bold text-accent-foreground"
      >
        {[...t(K.arabic_brand)][0]}
      </span>
      <Text className={isRail ? "sr-only" : "truncate font-semibold"}>{t(K.arabic_brand)}</Text>
    </div>
  );
}

/** The signed-in user: an avatar and the name; the avatar alone in the rail. */
function Account() {
  const t = useCatalogueText(MESSAGES.en);
  const { isRail } = useSidebar();
  return (
    <div className="flex min-w-0 items-center gap-2 px-1">
      <Avatar name={t(K.arabic_account)} size="sm" />
      <Text className={isRail ? "sr-only" : "truncate text-sm font-medium"}>
        {t(K.arabic_account)}
      </Text>
    </div>
  );
}

/** Sidebar: Arabic. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}#sidebar-arabic`;

  return (
    <div lang="ar" dir="rtl">
      <div className="h-[28rem] w-fit overflow-hidden rounded-[var(--radius-container)] border border-separator">
        <Sidebar
          keyboardShortcut={false}
          label={t(K.arabic_label)}
          startContent={<Brand />}
          endContent={<Account />}
          items={[
            { id: "home", label: t(K.arabic_home), href: here, icon: Icons.House },
            {
              id: "orders",
              label: t(K.arabic_orders),
              href: here,
              icon: Icons.Package,
              badge: 3,
              isCurrent: true,
            },
            { id: "customers", label: t(K.arabic_customers), href: here, icon: Icons.Users },
            { id: "inbox", label: t(K.arabic_inbox), href: here, icon: Icons.Inbox, badge: 12 },
            {
              id: "settings",
              label: t(K.arabic_settings),
              children: [
                { id: "profile", label: t(K.arabic_profile), href: here, icon: Icons.User },
                { id: "billing", label: t(K.arabic_billing), href: here, icon: Icons.CreditCard },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}
