/**
 * Stackra file contract:
 * Purpose: `ModalShortcuts`, the keyboard layer of an open Modal: it makes the dialog the topmost overlay scope (page
 *          shortcuts pause) and registers its confirm action (Mod+Enter) there.
 * Boundary: renders its children inside `ShortcutOverlayScope`; Escape stays React Aria's.
 * Runtime: browser
 * Governing contract: ADR 0508 (scopes; Mod+Enter confirm).
 */
import { STANDARD_SHORTCUTS } from "@stackra/shortcuts";
import { ShortcutOverlayScope, useShortcutActions } from "@stackra/shortcuts/react";
import type { ReactElement, ReactNode } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";

/** Registers the confirm action inside the overlay scope. */
function Confirm({
  onConfirm,
  shortcut,
}: {
  readonly onConfirm: () => void;
  readonly shortcut: string;
}): null {
  const t = useUiText();
  useShortcutActions([
    {
      id: "overlay.confirm",
      label: t(UI_KEYS.ui.shortcuts.confirm),
      shortcut,
      run: onConfirm,
    },
  ]);
  return null;
}

/** The modal's overlay scope and confirm key. */
export function ModalShortcuts({
  children,
  onConfirm,
  confirmShortcut,
}: {
  readonly children?: ReactNode;
  readonly onConfirm?: (() => void) | undefined;
  readonly confirmShortcut?: string | undefined;
}): ReactElement {
  return (
    <ShortcutOverlayScope>
      {onConfirm === undefined ? null : (
        <Confirm
          onConfirm={onConfirm}
          shortcut={confirmShortcut ?? STANDARD_SHORTCUTS["overlay.confirm"] ?? "mod+enter"}
        />
      )}
      {children}
    </ShortcutOverlayScope>
  );
}
