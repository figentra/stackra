/**
 * Stackra file contract:
 * Purpose: `usePanelNavigation()`, the navigation of the panel the nearest `PanelShell` frames, ready for `@stackra/ui`'s
 *          navigation components: one entry per group with its resources and documents as children, each translated,
 *          linked, marked current while the viewer is on or below it, and badged with its view's count.
 * Boundary: reads what `registerPanelPages` registered and the recorded trees (`panelNavigationOf`); an entry whose
 *           permission the viewer lacks is left out, and a group left empty with it. Each badge is one list read of its
 *           view asking for one row (through the query cache, so a List page on screen shares it); a read that fails
 *           or answers no count leaves the entry without a badge. A capped count shows as `10000+`.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 12: a navigation badge names a view); ADR 0214 (gate-filtered navigation);
 *                     ADR 0164; the SDUI catalogue case `resources` (navigation and badge), build-list item 53 (STA-1981).
 */
import type { QueryRef } from "@stackra/clients";
import { useQueryClient } from "@stackra/clients/react";
import { useTranslation } from "@stackra/i18n/react";
import type { NavigationItem } from "@stackra/ui/contracts";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";

import { panelNavigationOf } from "#core/functions/panel-navigation-of.function";
import { useCan } from "#react/action-runner/use-can";
import { usePanel } from "#react/panel-shell/use-panel";
import { PANEL_PAGES } from "#react/route-pages/panel-pages.constant";

/** What a list read answers about its count (`CrudService.table`'s page). */
interface Counted {
  readonly count?: { readonly value: number; readonly capped: boolean };
}

/** `path` without a trailing slash, the root kept. */
const trimmed = (path: string): string => path.replace(/(?<=.)\/+$/, "");

/**
 * The current panel's navigation.
 *
 * @throws Error outside a `PanelShell`.
 * @example
 * const items = usePanelNavigation();
 * <Sidebar items={items} />
 */
export function usePanelNavigation(): readonly NavigationItem[] {
  const { t } = useTranslation();
  const panel = usePanel();
  const can = useCan();
  const client = useQueryClient();
  const { pathname } = useLocation();
  const groups = useMemo(() => {
    const { resources = [], documents = [] } = PANEL_PAGES.current;
    return panelNavigationOf(panel, resources, documents)
      .map((group) => ({
        ...group,
        entries: group.entries.filter((entry) => can(entry.permission)),
      }))
      .filter((group) => group.entries.length > 0);
  }, [panel, can]);

  const [badges, setBadges] = useState<Readonly<Record<string, string | number>>>({});
  useEffect(() => {
    let isLive = true;
    const reads = groups
      .flatMap((group) => group.entries)
      .map(({ key, badge }) =>
        badge === undefined
          ? Promise.resolve([])
          : client.fetch(badge.query as QueryRef, badge.input as never).then(
              (answer): [string, string | number][] => {
                const count = (answer as Counted | undefined)?.count;
                if (count === undefined) return [];
                return [[key, count.capped ? `${count.value}+` : count.value]];
              },
              // A failed count leaves the entry without a badge; the List page reports the failure.
              (): [string, string | number][] => [],
            ),
      );
    void Promise.all(reads).then((rows) => {
      if (isLive) setBadges(Object.fromEntries(rows.flat()));
    });
    return () => {
      isLive = false;
    };
  }, [groups, client]);

  const current = trimmed(pathname);
  return groups.map((group): NavigationItem => ({
    id: group.group,
    label: t(group.group),
    children: group.entries.map((entry): NavigationItem => {
      const href = trimmed(entry.href);
      const badge = badges[entry.key];
      return {
        id: entry.key,
        label: t(entry.label),
        href: entry.href,
        icon: entry.icon,
        isCurrent: current === href || (href !== "/" && current.startsWith(`${href}/`)),
        ...(badge === undefined ? {} : { badge }),
      };
    }),
  }));
}
