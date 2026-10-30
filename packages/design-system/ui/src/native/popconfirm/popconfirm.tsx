/**
 * Stackra file contract:
 * Purpose: the native `Popconfirm`: a small question anchored to its trigger in the house Popover (HeroUI Native's),
 *          titled by the question, with an optional line of detail and a cancel and a confirm button in reading order.
 *          A press outside cancels. A confirm that returns a promise keeps it open with the confirm button pending.
 * Boundary: composes the native Popover, Text and Button; it sits inside the native DesignSystemProvider, as the
 *           Popover does. While a confirm is pending nothing closes it. Native has no Escape key.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { OVERLAY_SELECTION_KEYS } from "#core/constants/overlay-selection-keys.constant";
import { Button } from "#native/button/button";
import type { PopconfirmProps } from "#native/popconfirm/popconfirm.props";
import { Popover } from "#native/popover/popover";
import { Text } from "#native/text/text";
import { useUiText } from "#react/hooks/use-ui-text";

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
  const [own, setOwn] = useState(defaultOpen ?? false);
  const [isPending, setPending] = useState(false);
  const open = isOpen ?? own;

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
    <Popover
      trigger={trigger}
      title={title}
      hasArrow
      placement={placement}
      {...(align === undefined ? {} : { align })}
      isOpen={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else if (!isPending) cancel();
      }}
      className={["max-w-xs", className].filter(Boolean).join(" ")}
    >
      <View className="gap-3">
        {description === undefined ? null : <Text tone="muted">{description}</Text>}
        <View className="flex-row justify-end gap-2">
          <Button size="sm" variant="ghost" isDisabled={isPending} onPress={cancel}>
            {cancelLabel ?? t(K.cancel)}
          </Button>
          <Button
            size="sm"
            variant={tone === "danger" ? "danger" : "primary"}
            isLoading={isPending}
            onPress={confirm}
          >
            {confirmLabel ?? t(K.confirm)}
          </Button>
        </View>
      </View>
    </Popover>
  );
}
