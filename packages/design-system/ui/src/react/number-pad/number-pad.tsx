/**
 * Stackra file contract:
 * Purpose: the web `NumberPad`: a display row (the amount, or one dot per PIN digit) over a 3 by 4 grid of key
 *          buttons (1 to 9, then the decimal key or a blank, 0 and delete). While focus is inside the pad the physical
 *          keyboard types too: digits, the decimal point (`.` or `,`) and Backspace. A PIN reports itself complete at
 *          full length, and the display is a polite live region.
 * Boundary: the editing rules are `nextPadValue` in core, shared with native. The grid keeps the keypad order left to
 *           right in every language (`dir="ltr"`), as POS terminals do; the page around it still mirrors. The digits
 *           are Latin.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28); ADR 0060 (RTL
 *          and Arabic); WCAG 2.2 SC 2.1.1, 4.1.3.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { useState } from "react";
import { Button as AriaButton } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { nextPadValue } from "#core/functions/next-pad-value.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import type { NumberPadProps } from "#react/number-pad/number-pad.props";

/** The keys, in reading order of a phone keypad. */
const KEYS = Object.freeze(["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "delete"]);

/** A keypad for amounts, quantities and PINs. */
export function NumberPad({
  value,
  defaultValue,
  onChange,
  maxLength,
  isPin = false,
  onComplete,
  hasDecimal = false,
  label,
  deleteLabel,
  isDisplayHidden = false,
  isDisabled = false,
  className,
  ...rest
}: NumberPadProps): ReactElement {
  const t = useUiText();
  const [ownValue, setOwnValue] = useState(defaultValue ?? "");
  const current = value ?? ownValue;
  const limit = maxLength ?? (isPin ? 4 : undefined);
  const decimal = hasDecimal && !isPin;

  const press = (key: string) => {
    if (isDisabled) return;
    const next = nextPadValue(current, key, { maxLength: limit, hasDecimal: decimal });
    if (next === undefined) return;
    setOwnValue(next);
    onChange?.(next);
    if (key !== "delete" && limit !== undefined && next.length === limit) onComplete?.(next);
  };

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- reason: the group takes typed digits bubbling from its own keys, so a hardware keyboard works as well as a press
    <div
      {...rest}
      role="group"
      aria-label={label}
      data-slot="number-pad"
      className={cn("grid gap-4", className) ?? ""}
      onKeyDown={(event) => {
        const key = event.key === "Backspace" ? "delete" : event.key === "," ? "." : event.key;
        if (!/^(\d|\.|delete)$/.test(key)) return;
        event.preventDefault();
        press(key);
      }}
    >
      {isDisplayHidden ? null : isPin ? (
        <div
          role="status"
          aria-label={`${label}: ${current.length}/${limit ?? 4}`}
          className="flex justify-center gap-3"
        >
          {Array.from({ length: limit ?? 4 }, (_, index) => (
            <span
              key={index}
              className={
                cn(
                  "size-3.5 rounded-full border border-foreground",
                  index < current.length && "bg-foreground",
                ) ?? ""
              }
            />
          ))}
        </div>
      ) : (
        <output
          aria-live="polite"
          aria-label={label}
          dir="ltr"
          className="text-center text-4xl font-semibold tabular-nums"
        >
          {current || "0"}
        </output>
      )}
      <div dir="ltr" className="grid grid-cols-3 gap-2">
        {KEYS.map((key) =>
          key === "." && !decimal ? (
            <span key={key} />
          ) : (
            <AriaButton
              key={key}
              isDisabled={isDisabled}
              onPress={() => press(key)}
              {...(key === "delete"
                ? { "aria-label": deleteLabel ?? t(UI_KEYS.ui.number_pad.delete) }
                : key === "."
                  ? { "aria-label": t(UI_KEYS.ui.number_pad.decimal) }
                  : {})}
              className={({ isPressed, isFocusVisible }) =>
                cn(
                  "flex h-14 items-center justify-center rounded-2xl text-2xl font-medium outline-none transition-transform duration-[var(--duration-fast)] motion-reduce:transition-none",
                  key === "delete" ? "bg-transparent" : "bg-default",
                  isPressed && "scale-95 bg-default-hover",
                  isFocusVisible && "ring-2 ring-focus",
                  isDisabled && "opacity-50",
                ) ?? ""
              }
            >
              {key === "delete" ? (
                <Icon name="delete" isMirroredInRtl={false} />
              ) : key === "." ? (
                // Drawn from an attribute, not text: the key is named "Decimal point", and axe cannot match a lone "." against it.
                <span
                  aria-hidden="true"
                  data-glyph="."
                  className="before:content-[attr(data-glyph)]"
                />
              ) : (
                key
              )}
            </AriaButton>
          ),
        )}
      </div>
    </div>
  );
}
