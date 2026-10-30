/**
 * Stackra file contract:
 * Purpose: the "collapsed" demo of the web Sidebar: the icon rail, 4 rem wide: a group heading becomes a thin rule, the active place keeps its
 *          icon and fill, a badge is a dot, and each label is the link's name and its tooltip.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           Cmd/Ctrl+B is left to the "live" demo, so one key press does not fold every sidebar on the page.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2; owner request 2026-10-29 (STA-1371).
 */
import type { NavigationItem } from "@stackra/ui/contracts";
import { Avatar, Sidebar, Text, useCatalogueText, useSidebar } from "@stackra/ui/react";
import { useLocation } from "react-router";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SIDEBAR_KEYS } from "#src/demos/free/sidebar/sidebar-keys.constant";

/** The demo's keys. */
const K = SIDEBAR_KEYS.sidebar;

/** The app's brand: a mark and its name; in the rail the mark alone, the name kept for screen readers. */
function Brand() {
  const t = useCatalogueText(MESSAGES.en);
  const { isRail } = useSidebar();
  return (
    <div className="flex min-w-0 items-center gap-2 px-1">
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)] bg-accent text-sm font-bold text-accent-foreground"
      >
        {t(K.brand_mark)}
      </span>
      <Text className={isRail ? "sr-only" : "truncate font-semibold"}>{t(K.brand)}</Text>
    </div>
  );
}

/** The signed-in user: an avatar and the name; in the rail the avatar alone. */
function Account() {
  const t = useCatalogueText(MESSAGES.en);
  const { isRail } = useSidebar();
  return (
    <div className="flex min-w-0 items-center gap-2 px-1">
      <Avatar name={t(K.account)} size="sm" />
      <Text className={isRail ? "sr-only" : "truncate text-sm font-medium"}>{t(K.account)}</Text>
    </div>
  );
}

/** Sidebar: Collapsed. */
export default function Collapsed() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const anchor = (id: string) => `${pathname}${search}#${id}`;
  const items = (id: string, currentId?: string): readonly NavigationItem[] => [
    {
      id: "home",
      label: t(K.home),
      href: anchor(id),
      icon: Icons.House,
      isCurrent: currentId === "home",
    },
    {
      id: "orders",
      label: t(K.orders),
      href: anchor(id),
      icon: Icons.Package,
      badge: 3,
      isCurrent: currentId === "orders",
    },
    { id: "customers", label: t(K.customers), href: anchor(id), icon: Icons.Users },
    { id: "inbox", label: t(K.inbox), href: anchor(id), icon: Icons.Inbox, badge: 12 },
    {
      id: "settings",
      label: t(K.settings),
      children: [
        { id: "profile", label: t(K.profile), href: anchor(id), icon: Icons.User },
        { id: "billing", label: t(K.billing), href: anchor(id), icon: Icons.CreditCard },
      ],
    },
  ];

  return (
    <div className="h-[28rem] w-fit overflow-hidden rounded-[var(--radius-container)] border border-separator">
      <Sidebar
        keyboardShortcut={false}
        label={t(K.collapsed_label)}
        items={items("sidebar-collapsed", "orders")}
        defaultCollapsed
        startContent={<Brand />}
        endContent={<Account />}
      />
    </div>
  );
}
