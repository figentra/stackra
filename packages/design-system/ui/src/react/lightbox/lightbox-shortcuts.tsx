/**
 * Stackra file contract:
 * Purpose: `LightboxShortcuts`, the open Lightbox's keys on the shortcut registry (ADR 0508): Left and Right step the
 *          images (mirrored right to left), Home and End jump to the first and the last, so the cheat sheet lists them.
 * Boundary: renders nothing; mounted inside the Lightbox's overlay scope, so the keys answer only while it is the
 *           topmost overlay. Off while zoomed, where the arrows pan instead.
 * Runtime: browser
 * Governing contract: ADR 0508 (overlay scope, RTL flip).
 */
import { STANDARD_SHORTCUTS } from "@stackra/shortcuts";
import { useShortcutActions } from "@stackra/shortcuts/react";

import { MEDIA_KEYS } from "#core/constants/media-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";

/** Registers the lightbox's keys. */
export function LightboxShortcuts({
  step,
  goTo,
  count,
  isZoomed,
}: {
  readonly step: (by: number) => void;
  readonly goTo: (index: number) => void;
  readonly count: number;
  readonly isZoomed: boolean;
}): null {
  const t = useUiText();
  const when = () => !isZoomed;
  useShortcutActions([
    {
      id: "media.previous",
      label: t(MEDIA_KEYS.ui.lightbox.previous),
      shortcut: STANDARD_SHORTCUTS["media.previous"],
      isDirectional: true,
      when,
      run: () => step(-1),
    },
    {
      id: "media.next",
      label: t(MEDIA_KEYS.ui.lightbox.next),
      shortcut: STANDARD_SHORTCUTS["media.next"],
      isDirectional: true,
      when,
      run: () => step(1),
    },
    {
      id: "media.first",
      label: t(UI_KEYS.ui.shortcuts.first),
      shortcut: "home",
      when,
      run: () => goTo(0),
    },
    {
      id: "media.last",
      label: t(UI_KEYS.ui.shortcuts.last),
      shortcut: "end",
      when,
      run: () => goTo(count - 1),
    },
  ]);
  return null;
}
