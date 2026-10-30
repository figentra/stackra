/**
 * Stackra file contract:
 * Purpose: the native `OtpInput` on HeroUI Native's InputOTP: one box per digit, typed or pasted, with the platform's
 *          one-time-code autofill; Arabic-Indic and Persian digits are kept as Latin digits. `onComplete` fires once
 *          every box is filled, with a success haptic.
 * Boundary: one TextInput under the boxes (`textContentType="oneTimeCode"`, `autoComplete="sms-otp"`, number pad),
 *           named by `label` or "Verification code". The boxes always run left to right.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055; WCAG 2.2
 *          SC 1.3.5, 4.1.2.
 */
import { InputOTP } from "heroui-native";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { pinDigitsOf } from "#core/functions/pin-digits-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { haptics } from "#native/haptics/haptics";
import { Text } from "#native/text/text";
import type { OtpInputProps } from "#native/otp-input/otp-input.props";

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
  className,
}: OtpInputProps): ReactElement {
  const t = useUiText();
  const [own, setOwn] = useState(defaultValue ?? "");
  const code = value ?? own;
  const name = typeof label === "string" ? label : t(FORMS_KEYS.ui.otp_input.label);
  return (
    <View className={`gap-1.5 ${className ?? ""}`}>
      {label == null ? null : <Text className="font-medium">{label}</Text>}
      <View style={{ direction: "ltr" }}>
        <InputOTP
          maxLength={length}
          value={code}
          inputMode="numeric"
          isDisabled={Boolean(isDisabled || isReadOnly)}
          isInvalid={Boolean(isInvalid)}
          pasteTransformer={(text) => pinDigitsOf(text, length)}
          onChange={(text) => {
            const digits = pinDigitsOf(text, length);
            if (value === undefined) setOwn(digits);
            onChange?.(digits);
          }}
          onComplete={(text) => {
            haptics.play("success");
            onComplete?.(pinDigitsOf(text, length));
          }}
          textInputProps={{
            accessibilityLabel: name,
            textContentType: "oneTimeCode",
            autoComplete: "sms-otp",
          }}
        >
          <InputOTP.Group>
            {Array.from({ length }, (_, index) => (
              <InputOTP.Slot key={index} index={index} />
            ))}
          </InputOTP.Group>
        </InputOTP>
      </View>
      {description == null ? null : (
        <Text type="small" tone="muted">
          {description}
        </Text>
      )}
      {isInvalid && errorMessage ? (
        <Text type="small" tone="danger" accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
