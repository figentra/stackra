/**
 * Stackra file contract:
 * Purpose: the native `PasswordField`: HeroUI Native's TextField and InputGroup with a masked input and a reveal toggle
 *          whose eye icon morphs, and a `pin` mode that takes only digits (Arabic-Indic ones read as Latin) up to
 *          `pinLength` on the number pad. Each time `isInvalid` turns true the field shakes with an error haptic; each
 *          time `isAccepted` turns true a success haptic plays.
 * Boundary: no styling of its own; the look is HeroUI Native's. Phones expose no Caps Lock state, so
 *           `capsLockMessage` is web only. Motion follows the system's reduced-motion setting; haptics follow the app
 *           switch. "Show password" and "Hide password" come from the `ui` catalogue.
 * Runtime: react-native
 * Governing contract: gap inventory row 3 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3); ADR 0055
 *          (forms: one field contract); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 3.3.8, 4.1.2.
 */
import {
  Description,
  FieldError,
  InputGroup as HeroInputGroup,
  Label,
  TextField as HeroTextField,
} from "heroui-native";
import { useEffect, useRef, useState } from "react";
import Animated, { ReduceMotion, ZoomIn } from "react-native-reanimated";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { pinDigitsOf } from "#core/functions/pin-digits-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import type { PasswordFieldProps } from "#native/password-field/password-field.props";
import { useShake } from "#native/shake/use-shake";

/** The eye's morph: it grows in from small, or simply appears under reduced motion. */
const MORPH = ZoomIn.duration(150)
  .withInitialValues({ transform: [{ scale: 0.6 }] })
  .reduceMotion(ReduceMotion.System);

/** A masked field with a reveal toggle; `mode="pin"` takes digits only. */
export function PasswordField({
  label,
  description,
  errorMessage,
  placeholder,
  variant = "primary",
  isFullWidth = true,
  mode = "password",
  pinLength = 4,
  isRevealable = true,
  revealLabel,
  concealLabel,
  capsLockMessage: _capsLockMessage,
  isAccepted,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  // `name` is the form adapter's key; a native text input has no form to submit under it.
  name: _name,
  className,
  accessibilityLabel,
  ...rest
}: PasswordFieldProps): ReactElement {
  const t = useUiText();
  const [isRevealed, setRevealed] = useState(false);
  const [own, setOwn] = useState(defaultValue ?? "");
  const current = value ?? own;
  const isPin = mode === "pin";
  const { style, shake } = useShake();
  const was = useRef({ isInvalid, isAccepted });

  useEffect(() => {
    if (isInvalid && !was.current.isInvalid) {
      shake();
      haptics.play("error");
    }
    if (isAccepted && !was.current.isAccepted) haptics.play("success");
    was.current = { isInvalid, isAccepted };
  }, [isInvalid, isAccepted, shake]);

  return (
    <Animated.View style={style} className={isFullWidth ? "" : "self-start"}>
      <HeroTextField
        {...omitUndefined({ isRequired, isInvalid, isDisabled })}
        className={className ?? ""}
      >
        {label == null ? null : <Label>{label}</Label>}
        <HeroInputGroup isDisabled={isDisabled ?? false}>
          <HeroInputGroup.Input
            accessibilityLabel={
              accessibilityLabel ?? (typeof label === "string" ? label : undefined)
            }
            placeholder={placeholder}
            variant={variant}
            value={current}
            onChangeText={(text) => {
              const next = isPin ? pinDigitsOf(text, pinLength) : text;
              if (value === undefined) setOwn(next);
              onChange?.(next);
            }}
            secureTextEntry={!isRevealed}
            autoCapitalize="none"
            autoCorrect={false}
            {...(isPin
              ? { keyboardType: "number-pad" as const, maxLength: pinLength }
              : {
                  textContentType: "password" as const,
                  autoComplete: "current-password" as const,
                })}
            readOnly={isReadOnly}
            {...rest}
          />
          {isRevealable ? (
            <HeroInputGroup.Suffix>
              <IconButton
                variant="ghost"
                size="sm"
                label={
                  isRevealed
                    ? (concealLabel ?? t(UI_KEYS.ui.password_field.hide))
                    : (revealLabel ?? t(UI_KEYS.ui.password_field.show))
                }
                onPress={() => setRevealed((shown) => !shown)}
                icon={
                  <Animated.View key={isRevealed ? "eye-off" : "eye"} entering={MORPH}>
                    <Icon name={isRevealed ? "eye-off" : "eye"} />
                  </Animated.View>
                }
              />
            </HeroInputGroup.Suffix>
          ) : null}
        </HeroInputGroup>
        {description == null ? null : <Description hideOnInvalid>{description}</Description>}
        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      </HeroTextField>
    </Animated.View>
  );
}
