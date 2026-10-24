/**
 * Stackra file contract:
 * Purpose: the native `AlertDialog`, the adapted form of the web one: HeroUI Native ships no AlertDialog, so it is its
 *          Dialog, announced as an `alertdialog`, with the tone's icon in a soft circle, the title, the description,
 *          any extra content and the two buttons, and the same props as on web (`isOpen`, `defaultOpen` and
 *          `onOpenChange` to a state that is controlled or its own; `isDismissable`; `isKeyboardDismissDisabled`;
 *          `tone`, `icon`, `onConfirm`, `onCancel`). Every other View prop passes through to the dialog's content.
 * Boundary: built on the free Dialog, Button and Icon only. Differences from web, all deliberate. A press on the
 *           backdrop is `isDismissable` alone (HeroUI's `isCloseOnPress` is set off and the press handled here), and
 *           the swipe-down gesture is on only when both a press outside and the back button may dismiss, because a
 *           swipe is a dismissal too. There is no Escape key: `isKeyboardDismissDisabled` governs the Android back
 *           button instead, which refuses the question unless it is set, as Escape does on web. Focus does not move to
 *           the cancel button, because native has no focus ring to start on; a screen reader lands on the title and
 *           the cancel button comes first among the buttons. A string child is wrapped in Text, as a native `View`
 *           cannot hold bare text. The portal asks iOS VoiceOver to stay inside the
 *           question (`unstable_accessibilityContainerViewIsModal`, which HeroUI Native marks unstable), as Modal and
 *           Drawer do. The confirm button is `danger` for the `danger` tone and `primary` otherwise. The
 *           tone's icon is drawn by name; the kit registers the four tone icons itself, and an app's own icon of the
 *           same name wins.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI Native
 *          on native); WAI-ARIA `alertdialog`; WCAG 2.2 SC 1.4.1 and 4.1.2.
 */
import { Dialog, useThemeColor, type DialogContentProps, type ThemeColor } from "heroui-native";
import { LucideProvider } from "lucide-react-native";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import type { Tone } from "#contracts/enums/tone.enum";
import type { AlertDialogContractProps } from "#contracts/types/alert-dialog-contract-props.type";
import { FEEDBACK_BY_TONE } from "#core/constants/feedback-by-tone.constant";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { Button } from "#native/button/button";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import { Text } from "#native/text/text";

/**
 * Props of the native AlertDialog: the shared contract plus the props of HeroUI Native's dialog content, passed
 * through (`className`, `style`, `animation`). The role is fixed at `alertdialog`, the swipe is the dismissal rules'
 * to decide, and the children are the contract's, so the type refuses them.
 */
export type AlertDialogProps = AlertDialogContractProps &
  Omit<
    DialogContentProps,
    keyof AlertDialogContractProps | "children" | "role" | "isSwipeable" | "background"
  >;

/** The circle and the icon colour of each tone: HeroUI's soft pair, as the web dialog's icon draws it. */
const ICON_COLOURS: Readonly<
  Record<Tone, { readonly background: ThemeColor; readonly foreground: ThemeColor }>
> = Object.freeze({
  default: { background: "default", foreground: "foreground" },
  accent: { background: "accent-soft", foreground: "accent-soft-foreground" },
  success: { background: "success-soft", foreground: "success-soft-foreground" },
  warning: { background: "warning-soft", foreground: "warning-soft-foreground" },
  danger: { background: "danger-soft", foreground: "danger-soft-foreground" },
});

/**
 * A modal that interrupts the user to confirm or refuse one decision. Confirming calls `onConfirm` and closes it;
 * every other way out (cancel, the Android back button, a press outside when `isDismissable`) calls `onCancel` and
 * closes it. It must sit inside HeroUI Native's provider, which hosts the portal the dialog draws in.
 */
export function AlertDialog({
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  tone = "default",
  icon,
  isOpen,
  defaultOpen = false,
  onOpenChange,
  isDismissable = false,
  isKeyboardDismissDisabled = false,
  isConfirmDisabled = false,
  onConfirm,
  onCancel,
  ...rest
}: AlertDialogProps): ReactElement {
  const [ownIsOpen, setOwnIsOpen] = useState(defaultOpen);
  const isShown = isOpen ?? ownIsOpen;
  const colours = ICON_COLOURS[tone];
  const background = useThemeColor(colours.background);
  const foreground = useThemeColor(colours.foreground);

  const setIsShown = (next: boolean) => {
    if (isOpen === undefined) setOwnIsOpen(next);
    onOpenChange?.(next);
  };
  const cancel = () => {
    onCancel?.();
    setIsShown(false);
  };
  const confirm = () => {
    onConfirm?.();
    setIsShown(false);
  };

  const drawn = icon === false ? undefined : (icon ?? FEEDBACK_BY_TONE[tone].icon);

  return (
    // HeroUI's dialog calls `onOpenChange` from the back button only here: its own backdrop press is switched off
    // below and the swipe is off unless the back button may dismiss too, so this is the back button's rule.
    <Dialog
      isOpen={isShown}
      onOpenChange={(next) => {
        if (!next && !isKeyboardDismissDisabled) cancel();
      }}
    >
      <Dialog.Portal unstable_accessibilityContainerViewIsModal>
        <Dialog.Overlay isCloseOnPress={false} {...(isDismissable ? { onPress: cancel } : {})} />
        <Dialog.Content
          role="alertdialog"
          isSwipeable={isDismissable && !isKeyboardDismissDisabled}
          {...rest}
        >
          {drawn === undefined ? null : (
            <View
              className="mb-3 size-10 items-center justify-center rounded-3xl"
              style={{ backgroundColor: background }}
            >
              <LucideProvider size={ICON_SIZES.md} color={foreground}>
                <SlotIcon icon={drawn} />
              </LucideProvider>
            </View>
          )}
          <View className="mb-5 gap-1.5">
            <Dialog.Title>{title}</Dialog.Title>
            {description == null ? null : <Dialog.Description>{description}</Dialog.Description>}
          </View>
          {typeof children === "string" || typeof children === "number" ? (
            <Text className="mb-5">{children}</Text>
          ) : (
            children
          )}
          <View className="flex-row justify-end gap-3">
            <Button variant="secondary" onPress={cancel}>
              {cancelLabel}
            </Button>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              isDisabled={isConfirmDisabled}
              onPress={confirm}
            >
              {confirmLabel}
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
