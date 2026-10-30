/**
 * Stackra file contract:
 * Purpose: the "header-footer" demo of the web Sidebar: a workspace switcher in the header and the user's menu in the footer, both menus of the
 *          app's own; in the rail they shrink to the mark and the avatar.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           Cmd/Ctrl+B is left to the "live" demo, so one key press does not fold every sidebar on the page.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2; owner request 2026-10-29 (STA-1371).
 */
import { Avatar, Dropdown, Icon, Sidebar, useCatalogueText, useSidebar } from "@stackra/ui/react";
import { useLocation } from "react-router";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SIDEBAR_KEYS } from "#src/demos/free/sidebar/sidebar-keys.constant";

/** The demo's keys. */
const K = SIDEBAR_KEYS.sidebar;

/** The trigger look shared by the two menus: a full-width row that fills on hover. */
const ROW =
  "flex w-full min-w-0 items-center gap-2 rounded-[var(--radius-control)] p-1.5 text-start outline-none hover:bg-default focus-visible:outline-2 focus-visible:outline-focus";

/** The workspace switcher: the mark, the name and the plan; the mark alone in the rail. */
function Switcher() {
  const t = useCatalogueText(MESSAGES.en);
  const { isRail } = useSidebar();
  return (
    <Dropdown>
      <Dropdown.Trigger
        className={ROW}
        {...(isRail ? { "aria-label": t(K.switch_workspace) } : {})}
      >
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)] bg-accent text-sm font-bold text-accent-foreground"
        >
          {t(K.brand_mark)}
        </span>
        {isRail ? null : (
          <>
            <span className="grid min-w-0 flex-1">
              <span className="truncate text-sm font-semibold">{t(K.workspace)}</span>
              <span className="truncate text-xs text-muted">{t(K.workspace_plan)}</span>
            </span>
            <Icon name="chevron-down" size="sm" />
          </>
        )}
      </Dropdown.Trigger>
      <Dropdown.Menu
        aria-label={t(K.workspaces)}
        selectionMode="single"
        defaultSelectedKeys={["acme"]}
      >
        <Dropdown.Item id="acme" description={t(K.workspace_plan)}>
          {t(K.workspace)}
        </Dropdown.Item>
        <Dropdown.Item id="globex">{t(K.workspace_other)}</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

/** The user's menu: the avatar, the name and the email; the avatar alone in the rail. */
function UserMenu() {
  const t = useCatalogueText(MESSAGES.en);
  const { isRail } = useSidebar();
  return (
    <Dropdown>
      <Dropdown.Trigger className={ROW} {...(isRail ? { "aria-label": t(K.account_menu) } : {})}>
        <Avatar name={t(K.account)} size="sm" />
        {isRail ? null : (
          <span className="grid min-w-0 flex-1">
            <span className="truncate text-sm font-medium">{t(K.account)}</span>
            <span className="truncate text-xs text-muted">{t(K.account_email)}</span>
          </span>
        )}
      </Dropdown.Trigger>
      <Dropdown.Menu aria-label={t(K.account_menu)}>
        <Dropdown.Item id="profile">{t(K.profile)}</Dropdown.Item>
        <Dropdown.Item id="billing">{t(K.billing)}</Dropdown.Item>
        <Dropdown.Item id="sign-out" color="danger">
          {t(K.sign_out)}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

/** Sidebar: Switcher and user menu. */
export default function HeaderFooter() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}#sidebar-header-footer`;

  return (
    <div className="h-[28rem] w-fit overflow-hidden rounded-[var(--radius-container)] border border-separator">
      <Sidebar keyboardShortcut={false}>
        <Sidebar.Header>
          <Switcher />
        </Sidebar.Header>
        <Sidebar.Content label={t(K.header_footer_label)}>
          <Sidebar.Group>
            <Sidebar.Menu>
              <Sidebar.MenuItem
                label={t(K.dashboard)}
                icon={Icons.LayoutDashboard}
                href={here}
                isActive
              />
              <Sidebar.MenuItem label={t(K.orders)} icon={Icons.Package} href={here} />
              <Sidebar.MenuItem label={t(K.customers)} icon={Icons.Users} href={here} />
            </Sidebar.Menu>
          </Sidebar.Group>
          <Sidebar.Separator />
          <Sidebar.Group>
            <Sidebar.Menu>
              <Sidebar.MenuItem label={t(K.help)} icon={Icons.LifeBuoy} href={here} />
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>
          <UserMenu />
        </Sidebar.Footer>
        <Sidebar.Rail />
      </Sidebar>
    </div>
  );
}
