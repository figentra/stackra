/**
 * Stackra file contract:
 * Purpose: the web `OtpInput` on HeroUI v3's InputOTP: one box per digit, typed, pasted or filled by the browser's
 *          one-time-code autofill; Arabic-Indic and Persian digits are kept as Latin digits. `onComplete` fires once
 *          every box is filled.
 * Boundary: one real input under the boxes (`autocomplete="one-time-code"`, numeric keyboard), named by `label` or
 *           the catalogue's "Verification code". The boxes always run left to right, as a code is read in Arabic too.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055; WCAG 2.2
 *          SC 1.3.5, 3.3.1, 4.1.2.
 */
import { Description, FieldError, InputOTP, Label, cn } from "@heroui/react";
import { useId, useState, type ReactElement } from "react";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { pinDigitsOf } from "#core/functions/pin-digits-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { OtpInputProps } from "#react/otp-input/otp-input.props";

/** A one-time code, one box per digit. */
export function OtpInput({
  length = 6,
  label,
  description,
  errorMessage,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  onComplete,
  name,
  className,
}: OtpInputProps): ReactElement {
  const t = useUiText();
  const id = useId();
  const [own, setOwn] = useState(defaultValue ?? "");
  const code = value ?? own;
  const change = (text: string) => {
    if (isReadOnly) return;
    const digits = pinDigitsOf(text, length);
    if (value === undefined) setOwn(digits);
    onChange?.(digits);
    if (digits.length === length) onComplete?.(digits);
  };
  return (
    // The library's typing input lies over the slots with transparent text (inline opacity 1): fully transparent
    // instead, it still types and the slots draw the digits, and axe no longer measures it at 1:1. By its data-slot:
    // Tailwind reads an underscore in an arbitrary variant as a space, so the class selector never matched.
    <div className={cn("grid gap-1.5 [&_[data-slot=input-otp]]:opacity-0!", className) ?? ""}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <InputOTP
        id={id}
        dir="ltr"
        maxLength={length}
        value={code}
        onChange={change}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={typeof label === "string" ? label : t(FORMS_KEYS.ui.otp_input.label)}
        isDisabled={isDisabled ?? false}
        isInvalid={isInvalid ?? false}
        {...(name ? { name } : {})}
      >
        <InputOTP.Group>
          {Array.from({ length }, (_, index) => (
            <InputOTP.Slot key={index} index={index} />
          ))}
        </InputOTP.Group>
      </InputOTP>
      {description ? <Description>{description}</Description> : null}
      {isInvalid && errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </div>
  );
}
