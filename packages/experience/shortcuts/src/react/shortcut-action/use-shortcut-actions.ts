/**
 * Stackra file contract:
 * Purpose: `useShortcutActions(actions)`, which registers a list of actions with the nearest `ShortcutProvider` while
 *          mounted (a menu's items, a toolbar's buttons), so their keys run them and the cheat sheet and palette list
 *          them.
 * Boundary: re-registers only when an action's id, words, binding, scope or availability change; `run` and `when` are
 *           read fresh at key time. Inside a `ShortcutOverlayScope` the default scope is `overlay`, else `page`.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import { use, useEffect, useRef } from "react";

import { ShortcutScope } from "#core/enums/shortcut-scope.enum";
import type { ShortcutAction } from "#core/types/shortcut-action.type";
import { ShortcutOverlayContext } from "#react/shortcut-provider/shortcut-overlay-context";
import { ShortcutRegistryContext } from "#react/shortcut-provider/shortcut-registry-context";

/**
 * Registers `actions` while mounted.
 *
 * @example
 * useShortcutActions([{ id: "doc.save", label: t("save"), shortcut: "mod+s", run: save }]);
 */
export function useShortcutActions(
  actions: readonly ShortcutAction[],
  options: { readonly within?: { readonly current: Element | null } } = {},
): void {
  const { registry } = use(ShortcutRegistryContext);
  const overlay = use(ShortcutOverlayContext);
  const latest = useRef(actions);
  latest.current = actions;
  const within = options.within;
  const signature = actions
    .map((action) =>
      [
        action.id,
        action.label,
        action.shortcut,
        action.group,
        action.scope,
        action.icon,
        action.permission,
        action.isDisabled,
        action.isDirectional,
      ].join("\u0000"),
    )
    .join("\u0001");
  useEffect(() => {
    const unregister = latest.current.map((action) =>
      registry.register({
        action: () => latest.current.find((one) => one.id === action.id),
        scope:
          action.scope ??
          (within !== undefined
            ? ShortcutScope.Focus
            : overlay === null
              ? ShortcutScope.Page
              : ShortcutScope.Overlay),
        overlay,
        within,
      }),
    );
    return () => {
      for (const one of unregister) one();
    };
    // `signature` stands for the actions' registered fields
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reason: re-register only when a registered field changes
  }, [registry, overlay, within, signature]);
}
