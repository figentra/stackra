/**
 * Stackra file contract:
 * Purpose: the web `Fab`: a round floating action button (an IconButton, or a Button with its label when extended)
 *          pinned to a bottom corner by reading direction (`inset-inline-end`), and with `actions` a speed dial: the
 *          related actions fade up above it one after another, each a small IconButton with its label, while the plus
 *          turns into a cross. Escape closes the dial and returns focus to the Fab.
 * Boundary: builds on `#react/button/button` and `#react/icon-button/icon-button`. It floats in its nearest positioned
 *           ancestor and, while it floats, counts itself in `FLOATING_FABS` so a bottom toast clears it on a phone; the fades and the turn use the theme's `fast` step and stop under reduced motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28); WCAG 2.2 SC 2.1.1, 4.1.2.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

import type { FabPlacement } from "#contracts/enums/fab-placement.enum";
import type { FabAction } from "#contracts/types/fab-action.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Button } from "#react/button/button";
import type { FabProps } from "#react/fab/fab.props";
import { FLOATING_FABS } from "#core/constants/floating-fabs.constant";
import { IconButton } from "#react/icon-button/icon-button";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/** Where the Fab sits; logical insets, so the corners follow the reading direction. */
const POSITION: Readonly<Record<FabPlacement, string>> = Object.freeze({
  "bottom-end": "absolute bottom-4 end-4 items-end",
  "bottom-start": "absolute bottom-4 start-4 items-start",
  "bottom-center": "absolute inset-x-0 bottom-4 items-center pointer-events-none",
  inline: "items-start",
});
const FAST = motionTiming(STACKRA_THEME, "fast");
/** The turn: the theme's fast step, none under reduced motion. */
const TURN = "transition-transform duration-[var(--duration-fast)] motion-reduce:transition-none";

/** The one main action of a screen, floating over it, or a speed dial of related actions. */
export function Fab({
  label,
  icon = "plus",
  isExtended = false,
  onPress,
  actions,
  onAction,
  placement = "bottom-end",
  variant = "primary",
  size = "lg",
  isDisabled,
  isOpen,
  defaultOpen,
  onOpenChange,
  className,
  ...rest
}: FabProps): ReactElement {
  const hasDial = actions !== undefined && actions.length > 0;
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const open = hasDial && (isOpen ?? ownOpen);
  const dialId = useId();
  const root = useRef<HTMLDivElement>(null);
  const isReduced = useReducedMotion() === true;
  // A floating Fab tells the ToastProvider it is there, so a bottom toast on a phone is lifted clear of it.
  useEffect(() => (placement === "inline" ? undefined : FLOATING_FABS.register()), [placement]);
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };
  const press = () => {
    onPress?.();
    if (hasDial) setOpen(!open);
  };
  const choose = (action: FabAction) => {
    action.onPress?.();
    onAction?.(action.id);
    setOpen(false);
  };
  const drawn = (
    <span className={cn("inline-flex", TURN, open && icon === "plus" && "rotate-45")}>
      <SlotIcon icon={open && icon !== "plus" ? "x" : icon} />
    </span>
  );
  const shared = {
    variant,
    size,
    onPress: press,
    className: "pointer-events-auto rounded-[var(--radius-pill)] shadow-lg",
    ...(hasDial ? { "aria-expanded": open, "aria-controls": dialId } : {}),
    ...omitUndefined({ isDisabled }),
  };
  const isStart = placement === "bottom-start";

  // A floating dial dims what is under it; a press on the scrim closes the dial. An inline Fab has nothing to cover.
  const scrim =
    placement === "inline" ? null : (
      <AnimatePresence>
        {open ? (
          <motion.div
            aria-hidden="true"
            data-slot="fab-scrim"
            initial={isReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: isReduced ? 0 : FAST.durationMs / 1000 } }}
            transition={{ duration: FAST.durationMs / 1000, ease: "easeOut" }}
            className="absolute inset-0 z-10 bg-backdrop"
            onClick={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    );

  return (
    <>
      {scrim}
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- reason: a layout wrapper that only catches Escape bubbling from the speed dial's own buttons; it is not a control */}
      <div
        {...rest}
        ref={root}
        data-slot="fab"
        className={cn("z-10 flex flex-col gap-3", POSITION[placement], className)}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !open) return;
          setOpen(false);
          root.current?.querySelector<HTMLElement>("[aria-controls]")?.focus();
        }}
      >
        <AnimatePresence>
          {open ? (
            <ul id={dialId} className="flex flex-col gap-3">
              {actions.map((action, index) => (
                <motion.li
                  key={action.id}
                  initial={isReduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    isReduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 8 }
                  }
                  transition={{
                    duration: FAST.durationMs / 1000,
                    delay: isReduced ? 0 : ((actions.length - 1 - index) * 30) / 1000,
                    ease: "easeOut",
                  }}
                  className={cn(
                    "pointer-events-auto flex items-center gap-2",
                    isStart ? "flex-row-reverse justify-end" : "flex-row justify-end",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="rounded-[var(--radius-pill)] bg-surface px-3 py-1.5 text-sm shadow-sm"
                  >
                    {action.label}
                  </span>
                  <IconButton
                    label={action.label}
                    icon={action.icon}
                    variant="secondary"
                    className="rounded-[var(--radius-pill)] shadow-sm"
                    onPress={() => choose(action)}
                  />
                </motion.li>
              ))}
            </ul>
          ) : null}
        </AnimatePresence>
        {isExtended ? (
          <Button {...shared} startIcon={drawn}>
            {label}
          </Button>
        ) : (
          <IconButton {...shared} label={label} icon={drawn} />
        )}
      </div>
    </>
  );
}
