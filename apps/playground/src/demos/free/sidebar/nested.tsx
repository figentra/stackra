/**
 * Stackra file contract:
 * Purpose: the "nested" demo of the web Sidebar: composed parts: an entry with a sub-menu under an indent guide (open while it holds the
 *          active place), a folding entry, and a folding group with an action in its heading.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           Cmd/Ctrl+B is left to the "live" demo, so one key press does not fold every sidebar on the page.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2; owner request 2026-10-29 (STA-1371).
 */
import { IconButton, Sidebar, Text, useCatalogueText, useSidebar } from "@stackra/ui/react";
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

/** Sidebar: Nested and folding. */
export default function Nested() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}#sidebar-nested`;

  return (
    <div className="h-[30rem] w-fit overflow-hidden rounded-[var(--radius-container)] border border-separator">
      <Sidebar keyboardShortcut={false}>
        <Top />
        <Sidebar.Content label={t(K.nested_label)}>
          <Sidebar.Group>
            <Sidebar.Menu>
              <Sidebar.MenuItem label={t(K.dashboard)} icon={Icons.LayoutDashboard} href={here} />
              <Sidebar.MenuItem label={t(K.reports)} icon={Icons.ChartColumn} href={here}>
                <Sidebar.MenuItem label={t(K.sales)} href={here} isActive />
                <Sidebar.MenuItem label={t(K.traffic)} href={here} />
              </Sidebar.MenuItem>
              <Sidebar.MenuItem label={t(K.settings)} icon={Icons.Settings}>
                <Sidebar.MenuItem label={t(K.profile)} icon={Icons.User} href={here} />
                <Sidebar.MenuItem label={t(K.billing)} icon={Icons.CreditCard} href={here} />
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.Group>
          <Sidebar.Group
            label={t(K.projects)}
            isCollapsible
            action={
              <IconButton size="sm" variant="ghost" icon={Icons.Plus} label={t(K.add_project)} />
            }
          >
            <Sidebar.Menu>
              <Sidebar.MenuItem label={t(K.project_redesign)} icon={Icons.Folder} href={here} />
              <Sidebar.MenuItem label={t(K.project_mobile)} icon={Icons.Folder} href={here} />
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
      </Sidebar>
    </div>
  );
}
