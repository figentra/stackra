/**
 * Stackra file contract:
 * Purpose: the web `TimePicker`: a TimeField with a clock button that opens a WheelTimePicker in a popover; the
 *          wheel and the typed segments edit the same time.
 * Boundary: the popover is React Aria's (focus moves in, Escape and a press outside close it, focus returns to the
 *           button). Its open state is the overlay vocabulary (ADR 0312).
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312; WCAG 2.2
 *          SC 2.1.1, 4.1.2.
 */
import { Button, Dialog, DialogTrigger, Popover } from "react-aria-components";
import { useState, type ReactElement } from "react";

import type { TimeValue } from "#contracts/types/time-value.type";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { TimeField } from "#react/time-field/time-field";
import { WheelTimePicker } from "#react/wheel-picker/wheel-time-picker";
import type { TimePickerProps } from "#react/time-picker/time-picker.props";

/** A time field with a wheel in a popover. */
export function TimePicker({
  value,
  defaultValue,
  onChange,
  isOpen,
  defaultOpen,
  onOpenChange,
  minuteStep = 5,
  pickerButtonLabel,
  hourCycle,
  isDisabled,
  isReadOnly,
  ...rest
}: TimePickerProps): ReactElement {
  const t = useUiText();
  const [own, setOwn] = useState<TimeValue | null>(defaultValue ?? null);
  const time = value === undefined ? own : value;
  const change = (next: TimeValue | null) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const isLocked = Boolean(isDisabled || isReadOnly);
  return (
    <TimeField
      {...rest}
      {...omitUndefined({ hourCycle, isDisabled, isReadOnly })}
      value={time}
      onChange={change}
      end={
        <DialogTrigger
          {...omitUndefined({ isOpen: isLocked ? false : isOpen, defaultOpen, onOpenChange })}
        >
          {/* The field's suffix slot is pointer-events: none (it is built for icons); the button turns them back on. */}
          <Button
            aria-label={pickerButtonLabel ?? t(FORMS_KEYS.ui.time_picker.open)}
            isDisabled={isLocked}
            className="pointer-events-auto flex size-6 items-center justify-center rounded-[var(--radius-control)] text-muted outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus"
          >
            <Icon name="clock" size="sm" />
          </Button>
          <Popover className="rounded-[var(--radius-container)] bg-overlay p-2 shadow-lg outline-none">
            <Dialog
              aria-label={pickerButtonLabel ?? t(FORMS_KEYS.ui.time_picker.open)}
              className="outline-none"
            >
              <WheelTimePicker
                className="w-56"
                value={time ?? { hour: 9, minute: 0 }}
                onChange={change}
                minuteStep={minuteStep}
                {...omitUndefined({ hourCycle })}
              />
            </Dialog>
          </Popover>
        </DialogTrigger>
      }
    />
  );
}
