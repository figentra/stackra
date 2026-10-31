/**
 * Stackra file contract:
 * Purpose: the "badges" demo of the web Sidebar: badges, shortcuts read as keys, a disabled entry, and an action menu on an entry that shows
 *          on hover and focus; in the rail a badge is a dot.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           Cmd/Ctrl+B is left to the "live" demo, so one key press does not fold every sidebar on the page.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2; owner request 2026-10-29 (STA-1371).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { ActionMenu, Sidebar, Text, useCatalogueText, useSidebar } from "@stackra/ui/react";
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

/** The header row: the brand and the toggle side by side, stacked in the rail. */
function Top() {
  const { isRail } = useSidebar();
  return (
    <Sidebar.Header>
      <div className={isRail ? "flex flex-col items-center gap-2" : "flex items-center gap-2"}>
        <Brand />
        <Sidebar.Trigger className={isRail ? "" : "ms-auto"} />
      </div>
    </Sidebar.Header>
  );
}

/** Sidebar: Badges, shortcuts and actions. */
export default function Badges() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}#sidebar-badges`;

  /** An entry's own actions. */
  const more = (label: string) => {
    const sections: readonly MenuSection[] = [
      {
        id: "entry",
        title: label,
        isTitleHidden: true,
        items: [
          { id: "rename", label: t(K.rename), icon: Icons.Pencil },
          { id: "archive", label: t(K.archive), icon: Icons.Archive },
        ],
      },
    ];
    return (
      <ActionMenu label={t(K.more_for, { label })} size="sm" variant="ghost" sections={sections} />
    );
  };

  return (
    <div className="h-112 w-fit overflow-hidden rounded-[var(--radius-container)] border border-separator">
      <Sidebar keyboardShortcut={false}>
        <Top />
        <Sidebar.Content label={t(K.badges_label)}>
          <Sidebar.Group>
            <Sidebar.Menu>
              <Sidebar.MenuItem
                label={t(K.home)}
                icon={Icons.House}
                href={here}
                shortcut={t(K.shortcut_home)}
              />
              <Sidebar.MenuItem
                label={t(K.orders)}
                icon={Icons.Package}
                href={here}
                badge={3}
                isActive
                action={more(t(K.orders))}
              />
              <Sidebar.MenuItem
                label={t(K.customers)}
                icon={Icons.Users}
                href={here}
                shortcut={t(K.shortcut_customers)}
              />
              <Sidebar.MenuItem
                label={t(K.inbox)}
                icon={Icons.Inbox}
                href={here}
                badge={12}
                action={more(t(K.inbox))}
              />
              <Sidebar.MenuItem label={t(K.team)} icon={Icons.Users} href={here} isDisabled />
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
      </Sidebar>
    </div>
  );
}
