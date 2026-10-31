/**
 * Stackra file contract:
 * Purpose: `useActionShortcut(input)`, the one hook every shortcut-aware @stackra/ui component calls: it registers
 *          the action with the nearest `ShortcutProvider` (so the key runs the same handler the press runs) and returns
 *          what the component draws: the inline hint (visible mode), the hold-Mod badge, `aria-keyshortcuts`, and
 *          `wrap`, which puts the element in a Tooltip showing the keys (hidden mode, or a control with no room for an
 *          inline hint, like an icon button).
 * Boundary: a disabled action registers nothing; outside a provider nothing binds and the hint still draws. The
 *           registry, matching and settings are @stackra/shortcuts'; this only places HeroUI's Kbd.
 * Runtime: browser
 * Governing contract: ADR 0508 (hint modes, hold-Mod badges, aria-keyshortcuts).
 */
import type { ShortcutAction } from "@stackra/shortcuts";
import { useShortcutAction } from "@stackra/shortcuts/react";

import type { ActionShortcut } from "#react/hooks/action-shortcut.type";
import type { ActionShortcutInput } from "#react/hooks/action-shortcut-input.type";
import { ShortcutHint } from "#react/shortcut-hint/shortcut-hint";
import { Tooltip } from "#react/tooltip/tooltip";

/**
 * Registers the action and returns its hint parts.
 *
 * @example
 * const keys = useActionShortcut({ shortcut, label, run: onPress, isDisabled });
 * return keys.wrap(<HeroButton {...keys.aria}>{children}{keys.hint}{keys.badge}</HeroButton>);
 */
export function useActionShortcut(input: ActionShortcutInput): ActionShortcut {
  const binding = input.action?.shortcut ?? input.shortcut;
  const label = input.action?.label ?? input.label ?? binding ?? "";
  const run = input.action?.run ?? input.run;
  const action: ShortcutAction | undefined =
    binding === undefined || run === undefined
      ? input.action
      : {
          scope: input.scope,
          group: input.group,
          isDirectional: input.isDirectional,
          ...input.action,
          id: input.action?.id ?? input.shortcutId ?? `keys:${binding}`,
          label,
          shortcut: binding,
          run,
          isDisabled: (input.isDisabled ?? false) || (input.action?.isDisabled ?? false),
        };
  const hint = useShortcutAction(action);
  const keys = hint.showHints ? hint.keys : undefined;
  const inline = keys !== undefined && hint.hintMode === "visible" && input.canInline !== false;
  return {
    hint: inline ? <ShortcutHint keys={keys} isDecorative className="ms-1" /> : null,
    badge:
      keys !== undefined && hint.isRevealed && !inline ? (
        <ShortcutHint keys={keys} isBadge isDecorative />
      ) : null,
    aria: hint.ariaKeyShortcuts === undefined ? {} : { "aria-keyshortcuts": hint.ariaKeyShortcuts },
    attach: (own) => (node) => {
      if (node !== null) {
        if (hint.ariaKeyShortcuts === undefined) node.removeAttribute("aria-keyshortcuts");
        else node.setAttribute("aria-keyshortcuts", hint.ariaKeyShortcuts);
      }
      if (typeof own === "function") own(node);
      // The caller handed its ref to be filled, as React would fill it.
      else if (own !== null && own !== undefined) Object.assign(own, { current: node });
    },
    // Always the same tree for a bound control, so switching the hint mode or seeing the first key press never
    // remounts it (and never drops its focus): the tooltip is only disabled when the inline hint shows.
    wrap: (element) =>
      hint.keys === undefined ? (
        element
      ) : (
        <Tooltip content={label} shortcut={hint.keys} isDisabled={keys === undefined || inline}>
          {element}
        </Tooltip>
      ),
    isBound: hint.keys !== undefined,
  };
}
