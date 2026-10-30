/**
 * Stackra file contract:
 * Purpose: the "frame" demo of the web App shell: From 768 px up the sidebar is a column, and the sidebar’s toggle
 *          folds it to an icon rail. Below 768 px the column is gone and the header’s button opens it in a drawer.
 *          Resize the window to see both.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 1.4.10, 2.4.1 and
 *          2.4.3.
 */
import type { LayoutBreakpoint, NavigationItem } from "@stackra/ui/contracts";
import {
  AppShell as UiAppShell,
  Heading,
  IconButton,
  Sidebar,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { useLocation } from "react-router";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { APP_SHELL_KEYS } from "#src/demos/free/app-shell/app-shell-keys.constant";

/** The demo's keys. */
const K = APP_SHELL_KEYS.app_shell;

/** The box a shell sits in: an embedded shell fills its container, so it needs a height. */
const BOX = "h-80 overflow-hidden border border-border";

/** The class that hides the header's button where the column shows, written out so Tailwind finds each. */
const HIDDEN_FROM: Record<LayoutBreakpoint, string> = {
  sm: "sm:hidden",
  md: "md:hidden",
  lg: "lg:hidden",
  xl: "xl:hidden",
};

/** Props of {@link DemoShell}. */
interface DemoShellProps {
  /** The id of the shell's main region, unique on the page. */
  readonly mainId: string;
  /** The sidebar's landmark name, unique on the page. */
  readonly label?: string | undefined;
  /** The navigation entries, or none for a shell without a sidebar. */
  readonly items?: readonly NavigationItem[] | undefined;
  /** The brand text in the header and the sidebar. */
  readonly brand?: string | undefined;
  /** The page's heading, a level-3 heading under the section's. */
  readonly heading?: string | undefined;
  /** The page's sentence. */
  readonly body?: string | undefined;
  /** The breakpoint the shell collapses under; the default is the component's own. */
  readonly collapseBelow?: LayoutBreakpoint | undefined;
  /** True to show the header's button at every width, so the drawer can be tried on a wide window. */
  readonly isOpenerAlwaysShown?: boolean | undefined;
  /** Called with each new open state of the drawer. */
  readonly onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** The label of the header's button; left out, the shell has no button. */
  readonly openLabel?: string | undefined;
}

/** One embedded shell with a header holding the drawer's button, a sidebar and a page. */
function DemoShell(props: DemoShellProps) {
  const t = useCatalogueText(MESSAGES.en);
  const {
    mainId,
    label,
    items,
    brand = t(K.brand),
    heading = t(K.heading),
    body = t(K.body),
    collapseBelow,
    isOpenerAlwaysShown = false,
    onOpenChange,
    openLabel = t(K.open_navigation),
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hiddenFrom = HIDDEN_FROM[collapseBelow ?? "md"];
  const change = (next: boolean) => {
    setIsOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className={BOX}>
      <UiAppShell
        isEmbedded
        mainId={mainId}
        isOpen={isOpen}
        onOpenChange={change}
        collapseBelow={collapseBelow}
        header={
          <header className="flex items-center gap-2 border-b border-border p-2">
            {items === undefined ? null : (
              <IconButton
                variant="ghost"
                icon="menu"
                label={openLabel}
                className={isOpenerAlwaysShown ? "" : hiddenFrom}
                onPress={() => change(true)}
              />
            )}
            <Text className="font-semibold">{brand}</Text>
          </header>
        }
        sidebar={
          items === undefined
            ? undefined
            : // oxlint-disable-next-line react/no-unstable-nested-components -- the shell calls this render prop for the sidebar, it is not a component type
              ({ isInDrawer }) => (
                <Sidebar
                  label={label}
                  items={items}
                  isCollapsible={!isInDrawer}
                  isCollapsed={!isInDrawer && isCollapsed}
                  onCollapsedChange={setIsCollapsed}
                />
              )
        }
      >
        <div className="grid gap-2 p-4">
          <Heading level={3}>{heading}</Heading>
          <Text tone="muted">
            <bdi>{body}</bdi>
          </Text>
        </div>
      </UiAppShell>
    </div>
  );
}

/** App shell: Frame. */
export default function Frame() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;

  const items = (id: string): readonly NavigationItem[] => [
    { id: "home", label: t(K.home), href: `${here}#${id}`, icon: Icons.House },
    {
      id: "orders",
      label: t(K.orders),
      href: `${here}#${id}`,
      icon: Icons.Package,
      isCurrent: true,
    },
    { id: "customers", label: t(K.customers), href: `${here}#${id}`, icon: Icons.Users },
    { id: "inbox", label: t(K.inbox), href: `${here}#${id}`, icon: Icons.Inbox, badge: 12 },
  ];

  return (
    <DemoShell
      mainId="app-shell-frame-main"
      label={t(K.frame_label)}
      items={items("app-shell-frame")}
    />
  );
}
