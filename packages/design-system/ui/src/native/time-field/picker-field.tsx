/**
 * Stackra file contract:
 * Purpose: `PickerField`, the shell of the native TimeField, TimePicker and DateRangePicker: a labelled read-only field
 *          that opens a modal holding a picker, with Cancel and Done; the value only changes on Done.
 * Boundary: internal; the HeroUI Native TextField parts as the native DateInput draws them. Read-only shows and never
 *           opens; disabled refuses presses. The field is a button valued by its text.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0312 (open state); WCAG 2.2 SC 4.1.2.
 */
import { Description, FieldError, Input, Label, TextField as HeroTextField } from "heroui-native";
import { useState, type ReactElement, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import type { IconName } from "@stackra/icons/contracts";

import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { IconButton } from "#native/icon-button/icon-button";
import { Modal } from "#native/modal/modal";

/** A field that opens a picker in a modal. */
export function PickerField({
  label,
  description,
  errorMessage,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  isFullWidth = true,
  variant = "primary",
  text,
  icon,
  buttonLabel,
  isOpen,
  defaultOpen,
  onOpenChange,
  onDone,
  accessibilityLabel,
  className,
  children,
}: Pick<
  FieldContractProps<unknown>,
  | "label"
  | "description"
  | "errorMessage"
  | "isRequired"
  | "isInvalid"
  | "isDisabled"
  | "isReadOnly"
> &
  OpenStateContractProps & {
    readonly isFullWidth?: boolean | undefined;
    readonly variant?: "primary" | "secondary" | undefined;
    readonly text: string;
    readonly icon: IconName;
    readonly buttonLabel?: string | undefined;
    readonly onDone: () => void;
    readonly accessibilityLabel?: string | undefined;
    readonly className?: string | undefined;
    readonly children: ReactNode;
  }): ReactElement {
  const t = useUiText();
  const WORDS = UI_KEYS.ui.date_field;
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const isLocked = Boolean(isDisabled || isReadOnly);
  const open = (isOpen ?? ownOpen) && !isLocked;
  const name = accessibilityLabel ?? (typeof label === "string" ? label : undefined);
  const setOpen = (next: boolean) => {
    if (isOpen === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };
  return (
    <HeroTextField
      {...omitUndefined({ isRequired, isInvalid, isDisabled })}
      className={[isFullWidth ? "" : "self-start", className].filter(Boolean).join(" ")}
    >
      {label == null ? null : <Label>{label}</Label>}
      <View className="flex-row items-center gap-2">
        <Pressable
          className="flex-1"
          disabled={Boolean(isDisabled)}
          onPress={() => (isLocked ? undefined : setOpen(true))}
          accessibilityRole="button"
          accessibilityLabel={name}
          accessibilityValue={{ text: text || t(WORDS.empty) }}
          accessibilityState={{ disabled: Boolean(isDisabled), expanded: open }}
        >
          <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
            <Input value={text} placeholder={t(WORDS.empty)} variant={variant} editable={false} />
          </View>
        </Pressable>
        {buttonLabel === undefined ? null : (
          <IconButton
            icon={icon}
            label={buttonLabel}
            variant="tertiary"
            isDisabled={isLocked}
            onPress={() => setOpen(true)}
          />
        )}
      </View>
      {description == null ? null : <Description hideOnInvalid>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      <Modal isOpen={open} onOpenChange={setOpen} label={name}>
        <Modal.Header>
          <Modal.Title>{label ?? name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{open ? children : null}</Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onPress={() => setOpen(false)}>
            {t(WORDS.cancel)}
          </Button>
          <Button
            onPress={() => {
              onDone();
              setOpen(false);
            }}
          >
            {t(WORDS.done)}
          </Button>
        </Modal.Footer>
      </Modal>
    </HeroTextField>
  );
}
