/**
 * Stackra file contract:
 * Purpose: `ContextMenu`, a menu class bound to one value on native: `<ContextMenu menu={OrderCardMenu} value={order}>`
 *          opens a bottom-sheet menu from its child with the menu's entries for that value: routes push their screen
 *          with params built from the value, actions run through the generated client with their input built from it
 *          (a destructive one in the danger tone, one the session may not run left out), links open, groups become
 *          submenus.
 * Boundary: drawn by `@stackra/ui`'s native `Menu`; labels are the entries' i18n keys, translated here. Entries behind a
 *           flag that is off are left out. Shortcut, separator, navigation and tabs entries have no meaning in a
 *           context menu and are skipped.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decisions 14 and 16); ADR 0303 (decision 1); ADR 0260 (decision 4).
 */
import type { ActionRef } from "@stackra/clients";
import type { UseActionResult } from "@stackra/clients/react";
import { useContainer } from "@stackra/container/react";
import { useTranslation } from "@stackra/i18n/react";
import { Menu } from "@stackra/ui/native";
import type { MenuItem as UiMenuItem } from "@stackra/ui/contracts";
import { useMemo, type ReactElement } from "react";

import { MenuItemKind } from "#core/enums/menu-item-kind.enum";
import { createMenuBuilder } from "#core/functions/create-menu-builder.function";
import { instanceOf } from "#core/functions/instance-of.function";
import type { MenuItem } from "#core/types/menu-item.type";
import { ActionRunners } from "#native/context-menu/action-runners";
import type { ContextMenuProps } from "#native/context-menu/context-menu.props";
import { useFlagCheck } from "#native/flags/use-flag-check";
import { useNavigate } from "#native/navigate/use-navigate";

// shortcut: English until the package ships its `navigation::menus.*` catalogue; swap in the key then.
const STRINGS = { actions: "Actions" } as const;

/** Every action in `list`, groups included, in declaration order. */
function actionsIn<V>(list: readonly MenuItem<V>[]): ActionRef[] {
  return list.flatMap((entry) =>
    entry.kind === MenuItemKind.Action
      ? [entry.action]
      : entry.kind === MenuItemKind.Group
        ? actionsIn(entry.items)
        : [],
  );
}

/**
 * A context menu over `children`.
 *
 * @example
 * <ContextMenu menu={OrderCardMenu} value={order}>
 *   <Card>...</Card>
 * </ContextMenu>
 */
export function ContextMenu<V>({ menu, value, children }: ContextMenuProps<V>): ReactElement {
  const container = useContainer();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isOn = useFlagCheck();
  const instance = useMemo(() => instanceOf(menu, container), [menu, container]);
  const entries = useMemo(() => instance.items(createMenuBuilder<V>()), [instance]);
  const shown = (entry: MenuItem<V>) =>
    !("flag" in entry) || entry.flag === undefined || isOn(entry.flag);
  const actions = useMemo(() => actionsIn(entries), [entries]);

  /** The ui entries of `list`, actions bound to their runners in declaration order. */
  const itemsOf = (
    list: readonly MenuItem<V>[],
    runnerOf: (action: ActionRef) => UseActionResult<ActionRef> | undefined,
  ): UiMenuItem[] =>
    list.filter(shown).flatMap((entry, index): UiMenuItem[] => {
      switch (entry.kind) {
        case MenuItemKind.Route: {
          const params = typeof entry.params === "function" ? entry.params(value) : entry.params;
          return [
            {
              id: `route:${entry.to.name}:${String(index)}`,
              label: t(entry.label ?? entry.to.name),
              ...(entry.icon === undefined ? {} : { icon: entry.icon }),
              onPress: () => navigate.to(entry.to, params),
            },
          ];
        }
        case MenuItemKind.Action: {
          const runner = runnerOf(entry.action);
          if (runner === undefined || !runner.isAllowed) return [];
          return [
            {
              id: `action:${entry.action.key}:${String(index)}`,
              label: t(entry.label ?? entry.action.key),
              ...(entry.icon === undefined ? {} : { icon: entry.icon }),
              ...(entry.destructive === true ? { tone: "danger" as const } : {}),
              isDisabled: runner.isPending,
              onPress: () => {
                runner.run(entry.input?.(value)).catch(() => undefined); // the runner keeps the refusal
              },
            },
          ];
        }
        case MenuItemKind.Link:
          return [{ id: `link:${entry.url}`, label: t(entry.label), href: entry.url }];
        case MenuItemKind.Group:
          return [
            {
              id: `group:${entry.label}`,
              label: t(entry.label),
              items: itemsOf(entry.items, runnerOf),
            },
          ];
        default:
          return [];
      }
    });

  return (
    <ActionRunners actions={actions}>
      {(runners) => {
        const runnerOf = (action: ActionRef) => runners[actions.indexOf(action)];
        return (
          <Menu
            presentation="bottom-sheet"
            sections={[
              {
                id: "context",
                title: STRINGS.actions,
                isTitleHidden: true,
                items: itemsOf(entries, runnerOf),
              },
            ]}
          >
            {children}
          </Menu>
        );
      }}
    </ActionRunners>
  );
}
