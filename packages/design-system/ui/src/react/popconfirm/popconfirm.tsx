/**
 * Stackra file contract:
 * Purpose: the web `Popconfirm`: a small question anchored to its trigger, in HeroUI's popover with an arrow, drawn
 *          as an `alertdialog` with the question as its heading, an optional line of detail that describes it, and a
 *          cancel and a confirm button. Focus starts on confirm, or on cancel when the tone is `danger`. Escape or a
 *          press outside cancels. A confirm that returns a promise keeps it open with the confirm button pending, and
 *          it closes once the promise resolves.
 * Boundary: composes HeroUI's Popover parts and the house Button; React Aria returns focus to the trigger on close.
 *           While a confirm is pending nothing closes it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WAI-ARIA `alertdialog`; WCAG 2.2 SC 2.1.1, 2.4.3 and 4.1.2; STA-1371
 *          (wave D, owner approval 2026-10-30).
 */
import { cn, Popover as HeroPopover } from "@heroui/react";
import { useId, useState, type ReactElement } from "react";

import { OVERLAY_SELECTION_KEYS } from "#core/constants/overlay-selection-keys.constant";
import { reactAriaPlacementOf } from "#core/functions/react-aria-placement-of.function";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import type { PopconfirmProps } from "#react/popconfirm/popconfirm.props";

/** The popconfirm's words. */
const K = OVERLAY_SELECTION_KEYS.ui.popconfirm;

/** Asks a short yes-or-no question beside the control that raised it. */
export function Popconfirm({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "default",
  onConfirm,
  onCancel,
  placement = "top",
  align,
  isOpen,
  defaultOpen,
  onOpenChange,
  className,
}: PopconfirmProps): ReactElement {
  const t = useUiText();
  const id = useId();
  const [own, setOwn] = useState(defaultOpen ?? false);
  const [isPending, setPending] = useState(false);
  const open = isOpen ?? own;
  const isDanger = tone === "danger";

  const setOpen = (next: boolean) => {
    if (isOpen === undefined) setOwn(next);
    onOpenChange?.(next);
  };
  const cancel = () => {
    onCancel?.();
    setOpen(false);
  };
  const confirm = () => {
    const result = onConfirm?.();
    if (!(result instanceof Promise)) {
      setOpen(false);
      return;
    }
    setPending(true);
    result.then(
      () => {
        setPending(false);
        setOpen(false);
      },
      // A refused confirm stays open, so the person can try again or cancel.
      () => setPending(false),
    );
  };

  return (
    <HeroPopover
      isOpen={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else if (!isPending) cancel();
      }}
    >
      {trigger}
      <HeroPopover.Content
        placement={reactAriaPlacementOf(placement, align)}
        className={cn("max-w-xs", className) ?? ""}
      >
        <HeroPopover.Arrow />
        <HeroPopover.Dialog
          role="alertdialog"
          {...(description === undefined ? {} : { "aria-describedby": `${id}-description` })}
        >
          <HeroPopover.Heading level={2}>{title}</HeroPopover.Heading>
          {description === undefined ? null : (
            <p id={`${id}-description`} className="mt-1 text-sm text-muted">
              {description}
            </p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              // oxlint-disable-next-line jsx-a11y/no-autofocus -- an alertdialog moves focus inside on open (WAI-ARIA); cancel first for a destructive question
              autoFocus={isDanger}
              isDisabled={isPending}
              onPress={cancel}
            >
              {cancelLabel ?? t(K.cancel)}
            </Button>
            <Button
              size="sm"
              variant={isDanger ? "danger" : "primary"}
              // oxlint-disable-next-line jsx-a11y/no-autofocus -- an alertdialog moves focus inside on open (WAI-ARIA)
              autoFocus={!isDanger}
              isLoading={isPending}
              onPress={confirm}
            >
              {confirmLabel ?? t(K.confirm)}
            </Button>
          </div>
        </HeroPopover.Dialog>
      </HeroPopover.Content>
    </HeroPopover>
  );
}
