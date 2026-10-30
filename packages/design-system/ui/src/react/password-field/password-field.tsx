/**
 * Stackra file contract:
 * Purpose: the web `PasswordField` on the web InputGroup: a masked input with a reveal toggle whose eye icon morphs, a
 *          caps-lock hint read out as it appears, and a `pin` mode that takes only digits (Arabic-Indic ones read as
 *          Latin) up to `pinLength`, on the numeric keypad. Each time `isInvalid` turns true the field shakes.
 * Boundary: no styling of its own; the look is the InputGroup's. The motion is skipped under prefers-reduced-motion. Web
 *           has no haptics, so `isAccepted` changes nothing here. "Show password", "Hide password" and the caps-lock
 *           hint come from the `ui` catalogue.
 * Runtime: browser
 * Governing contract: gap inventory row 3 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3); ADR 0055
 *          (forms: one field contract); WCAG 2.2 SC 3.3.8, 4.1.3.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { type KeyboardEvent, type ReactElement, useEffect, useRef, useState } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { pinDigitsOf } from "#core/functions/pin-digits-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { InputGroup } from "#react/input-group/input-group";
import type { PasswordFieldProps } from "#react/password-field/password-field.props";
import { Text } from "#react/text/text";

const FAST = motionTiming(STACKRA_THEME, "fast");
const BASE = motionTiming(STACKRA_THEME, "base");

/** A masked field with a reveal toggle; `mode="pin"` takes digits only. */
export function PasswordField({
  mode = "password",
  pinLength = 4,
  isRevealable = true,
  revealLabel,
  concealLabel,
  capsLockMessage,
  isAccepted: _isAccepted,
  value,
  defaultValue,
  onChange,
  isInvalid,
  onKeyDown,
  onKeyUp,
  ...rest
}: PasswordFieldProps): ReactElement {
  const t = useUiText();
  const [isRevealed, setRevealed] = useState(false);
  const [isCapsLock, setCapsLock] = useState(false);
  const [own, setOwn] = useState(defaultValue ?? "");
  const current = value ?? own;
  const isPin = mode === "pin";
  const isReduced = useReducedMotion() ?? false;
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const wasInvalid = useRef(isInvalid);

  useEffect(() => {
    if (isInvalid && !wasInvalid.current && !isReduced && scope.current)
      void animate(
        scope.current,
        { x: [0, -10, 10, -6, 6, 0] },
        { duration: (BASE.durationMs * 2) / 1000 },
      );
    wasInvalid.current = isInvalid;
  }, [isInvalid, isReduced, animate, scope]);

  const readCapsLock = (event: KeyboardEvent) => setCapsLock(event.getModifierState("CapsLock"));
  const toggleLabel = isRevealed
    ? (concealLabel ?? t(UI_KEYS.ui.password_field.hide))
    : (revealLabel ?? t(UI_KEYS.ui.password_field.show));

  return (
    <div
      ref={scope}
      data-slot="password-field"
      // The toggle sits inside the field, as HeroUI's InputGroup suffix pattern does: no divider, a tight end inset.
      className="grid gap-1 [&_[data-slot=input-group-suffix]]:border-0 [&_[data-slot=input-group-suffix]]:px-1"
    >
      <InputGroup
        {...rest}
        {...(isInvalid === undefined ? {} : { isInvalid })}
        type={isRevealed ? "text" : "password"}
        value={current}
        onChange={(text: string) => {
          const next = isPin ? pinDigitsOf(text, pinLength) : text;
          if (value === undefined) setOwn(next);
          onChange?.(next);
        }}
        {...(isPin
          ? { inputMode: "numeric" as const, maxLength: pinLength, autoComplete: "off" }
          : { autoComplete: rest.autoComplete ?? "current-password" })}
        onKeyDown={(event) => {
          readCapsLock(event);
          onKeyDown?.(event);
        }}
        onKeyUp={(event) => {
          readCapsLock(event);
          onKeyUp?.(event);
        }}
        suffix={
          isRevealable ? (
            <IconButton
              variant="ghost"
              size="sm"
              label={toggleLabel}
              onPress={() => setRevealed((shown) => !shown)}
              icon={
                <motion.span
                  key={isRevealed ? "eye-off" : "eye"}
                  className="inline-flex"
                  initial={isReduced ? false : { opacity: 0, scale: 0.6, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: FAST.durationMs / 1000 }}
                >
                  <Icon name={isRevealed ? "eye-off" : "eye"} />
                </motion.span>
              }
            />
          ) : undefined
        }
      />
      {/* Always present, so the hint is announced the moment it appears. */}
      <div role="status">
        {isCapsLock && !isPin ? (
          <Text type="small" tone="warning">
            {capsLockMessage ?? t(UI_KEYS.ui.password_field.caps_lock)}
          </Text>
        ) : null}
      </div>
    </div>
  );
}
