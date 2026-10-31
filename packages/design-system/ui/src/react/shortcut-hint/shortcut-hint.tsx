/**
 * Stackra file contract:
 * Purpose: `ShortcutHint`, the one key hint of @stackra/ui: HeroUI's free `Kbd`, one `Kbd.Content` per step of the
 *          binding in the platform's form (`⌘K` on Apple devices, `Ctrl+K` elsewhere), read as its spoken form
 *          ("Command K"), or hidden from screen readers when the control around it carries `aria-keyshortcuts`.
 * Boundary: presentation only. A string that is not a binding (an older caller's `⌘E`) is drawn as given. Parsing and the platform form are @stackra/shortcuts' (`formatShortcutKeys`); the
 *           labels are always Latin, also in Arabic, and the hint is isolated left to right so `⌘K` never reverses.
 * Runtime: browser
 * Governing contract: ADR 0508 (hints are HeroUI's Kbd; spoken text).
 */
import { Kbd, cn } from "@heroui/react";
import { normalizeShortcutKeys } from "@stackra/shortcuts";
import { useShortcutHint } from "@stackra/shortcuts/react";
import type { ReactElement } from "react";

import type { ShortcutHintProps } from "#react/shortcut-hint/shortcut-hint.props";

/** Whether `keys` parses as a binding. */
const isBinding = (keys: string): boolean => {
  try {
    normalizeShortcutKeys(keys);
    return true;
  } catch {
    return false;
  }
};

/** The key hint of a binding, or of an older caller's ready-made text. */
export function ShortcutHint({
  keys,
  isBadge,
  isDecorative,
  className,
}: ShortcutHintProps): ReactElement | null {
  // An id no remap uses: the hint draws `keys` as given.
  const { display } = useShortcutHint({ id: "", shortcut: keys });
  if (!isBinding(keys))
    // An older caller's ready-made text (`⌘E`): drawn as given.
    return (
      <Kbd dir="ltr" className={cn("shrink-0", className) ?? ""} aria-hidden={isDecorative}>
        <Kbd.Content>{keys}</Kbd.Content>
      </Kbd>
    );
  if (display === undefined) return null;
  return (
    <Kbd
      dir="ltr"
      data-slot="shortcut-hint"
      className={
        cn(
          "shrink-0 gap-1",
          isBadge &&
            "pointer-events-none absolute inset-x-0 bottom-full z-(--z-raised) mx-auto mb-1 w-max text-xs shadow-overlay",
          className,
        ) ?? ""
      }
      {...(isDecorative ? { "aria-hidden": true } : { role: "img", "aria-label": display.spoken })}
    >
      {display.steps.map((step, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- reason: a chord's steps are positional and may repeat
        <Kbd.Content key={index}>{step}</Kbd.Content>
      ))}
    </Kbd>
  );
}
