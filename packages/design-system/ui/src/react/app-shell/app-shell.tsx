/**
 * Stackra file contract:
 * Purpose: the web `AppShell`: the console's frame. A skip link first in the tab order, the `sidebar` in a column at the
 *          inline start, the `header` above the page and the page in the one `main` landmark (focusable by the skip
 *          link). From `collapseBelow` (default `md`) down the column is gone and the same sidebar is drawn in a
 *          `Drawer` on the start edge that the app opens through `isOpen`, `defaultOpen` and `onOpenChange`; choosing a
 *          navigation entry in the drawer closes it.
 * Boundary: HeroUI has no app frame, so this is a flex layout on theme tokens plus the `Drawer` of wave 4. It imports no
 *           other shell piece: `sidebar`, `header` and `children` are nodes, and the button that opens the drawer is a
 *           node in the header (ADR 0317 decision 4). `sidebar` may be a function of `{ isInDrawer }` so a sidebar
 *           collapsed to a rail in the page can be drawn in full in the drawer. The breakpoint is a static Tailwind
 *           class from a map, never a computed string (decision 6), so it follows the viewport, not the shell's own
 *           width. `isEmbedded` is for a shell drawn inside another page (a preview, the playground): it fills its box
 *           instead of the viewport, and its `main` is a plain `div` with no skip link, because the page around it
 *           already has both and a page holds one `main`. A drawer left open while the window grows past the breakpoint stays
 *           open until it is dismissed (see the shortcut note on {@link AppShell}).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0317 (decisions 1, 4, 5 and 6); ADR
 *          0165 (HeroUI v3 on web); WCAG 2.2 SC 1.3.1, 1.4.10, 2.4.1, 2.4.3 and 2.4.7.
 */
import { cn } from "@heroui/react";
import { useState, type ComponentPropsWithRef, type MouseEvent, type ReactElement } from "react";

import type { AppShellContractProps } from "#contracts/types/app-shell-contract-props.type";
import type { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#core/hooks/use-ui-text";
import { Button } from "#react/button/button";
import { Drawer } from "#react/drawer/drawer";

/** The sidebar column's visibility per breakpoint, written out so Tailwind finds each class. */
const COLUMN_FROM: Record<LayoutBreakpoint, string> = {
  sm: "hidden sm:block",
  md: "hidden md:block",
  lg: "hidden lg:block",
  xl: "hidden xl:block",
};

/**
 * Props of the web AppShell: the shared contract plus the root `div`'s own props, passed through.
 */
export type AppShellProps = AppShellContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof AppShellContractProps> & {
    /** True when the shell sits inside another page: it fills its box and draws no `main` landmark or skip link. */
    readonly isEmbedded?: boolean | undefined;
    /** The text of the skip link. Defaults to the `ui` catalogue's phrase in the active locale. */
    readonly skipLabel?: string | undefined;
    /** The id of the main region, the skip link's target. Defaults to `main-content`. */
    readonly mainId?: string | undefined;
  };

/**
 * The frame of the console: sidebar, header and page, with the sidebar in an off-canvas drawer on a narrow window. Put
 * a `Sidebar` in `sidebar`, an `AppHeader` in `header` and the page in `children`.
 */
// shortcut: a drawer left open while the window grows past the breakpoint stays open until it is dismissed; the app can
// close it from `onOpenChange`'s owner, and a matchMedia listener is the upgrade when that matters.
export function AppShell({
  children,
  sidebar,
  header,
  collapseBelow = "md",
  isOpen,
  defaultOpen = false,
  onOpenChange,
  isEmbedded = false,
  skipLabel,
  mainId = "main-content",
  className,
  ...rest
}: AppShellProps): ReactElement {
  const t = useUiText();
  skipLabel ??= t(UI_KEYS.ui.app_shell.skip);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const open = isOpen ?? ownOpen;
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };
  const draw = (isInDrawer: boolean) =>
    typeof sidebar === "function" ? sidebar({ isInDrawer }) : sidebar;

  /** Closes the drawer when a navigation entry inside it is chosen; a click on anything else leaves it open. */
  const closeOnEntry = (event: MouseEvent) => {
    if (event.target instanceof Element && event.target.closest("[data-navigation-item]"))
      setOpen(false);
  };

  return (
    <div
      {...rest}
      className={cn(
        "relative flex flex-col bg-background text-foreground",
        isEmbedded ? "h-full min-h-0" : "min-h-dvh",
        className,
      )}
    >
      {isEmbedded ? null : (
        <a
          href={`#${mainId}`}
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:p-2 focus:outline-2 focus:outline-focus"
        >
          {skipLabel}
        </a>
      )}
      <div className="flex min-h-0 flex-1">
        {sidebar === undefined ? null : (
          <div
            className={cn(
              COLUMN_FROM[collapseBelow],
              "shrink-0",
              isEmbedded ? "h-full" : "sticky top-0 h-dvh",
            )}
          >
            {draw(false)}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          {header}
          {isEmbedded ? (
            <div id={mainId} className="min-h-0 flex-1 overflow-auto">
              {children}
            </div>
          ) : (
            <main id={mainId} tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
          )}
        </div>
      </div>
      {sidebar === undefined ? null : (
        <Drawer
          isOpen={open}
          onOpenChange={setOpen}
          placement="start"
          label={t(UI_KEYS.ui.app_shell.navigation)}
        >
          <Drawer.Body className="p-0">
            {/* The capture phase, because React Aria's press handling stops an entry's click from bubbling. The
                entries are the keyboard-reachable controls; this only listens. */}
            {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- delegation only */}
            <div onClickCapture={closeOnEntry}>{draw(true)}</div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" slot="close">
              {t(UI_KEYS.ui.app_shell.close)}
            </Button>
          </Drawer.Footer>
        </Drawer>
      )}
    </div>
  );
}
