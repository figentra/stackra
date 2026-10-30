/**
 * Stackra file contract:
 * Purpose: `closeControlOf`, the props and content a Drawer or Modal close trigger takes for a `CloseControl`: for
 *          `"esc"`, the Escape key cap on a fine pointer and the close mark on a coarse one, inside one button named
 *          "Close, Esc" (the name holds the cap's visible "esc", SC 2.5.3), at least 24px square; for `"both"`, the
 *          key cap (fine pointer only) and the close mark.
 * Boundary: presentation only; the trigger is HeroUI's. Used by `DrawerClose` and `ModalClose`.
 * Runtime: browser
 * Governing contract: STA-1371 (owner, 2026-10-29); WCAG 2.2 SC 2.5.8 (target size).
 */
import { Kbd } from "@heroui/react";

import type { CloseControl } from "#contracts/types/close-control.type";
import type { IconSlot } from "#contracts/types/icon-slot.type";
import type { CloseControlParts } from "#react/drawer/close-control-parts.type";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/** The content and classes of a close trigger drawn as `control` (`"none"` is the caller's to skip). */
export function closeControlOf(
  control: CloseControl,
  icon: IconSlot | undefined,
): CloseControlParts {
  const mark = icon === undefined ? undefined : <SlotIcon icon={icon} />;
  if (control !== "esc" && control !== "both")
    return { children: mark, className: undefined, isEsc: false };
  const cap = (
    <Kbd aria-hidden className="hidden pointer-fine:inline-flex">
      <Kbd.Content>{"esc"}</Kbd.Content>
    </Kbd>
  );
  const cross = <SlotIcon icon={icon ?? "x"} />;
  return {
    children:
      control === "both" ? (
        <span aria-hidden className="inline-flex items-center gap-1.5">
          {cap}
          {cross}
        </span>
      ) : (
        <>
          {cap}
          <span aria-hidden className="inline-flex pointer-fine:hidden">
            {cross}
          </span>
        </>
      ),
    // pointer-fine: the key cap sets the width; the box never drops under 24px (SC 2.5.8).
    className: "min-h-6 min-w-6 pointer-fine:w-auto pointer-fine:bg-transparent pointer-fine:p-0",
    isEsc: true,
  };
}
