/**
 * Stackra file contract:
 * Purpose: the native `InlineEdit`: a read-only value that opens an editor in place when tapped. The editor saves on its
 *          save button or the keyboard's return key and cancels on its cancel button; `validate` keeps it open with an
 *          error and an error haptic. Read and edit modes cross-fade on one row of the field's height, and a saved
 *          value flashes the success colour with a success haptic.
 * Boundary: the look is the house TextField and IconButton and the theme's colour and radius tokens. Motion follows the
 *           system's reduced-motion setting; haptics follow the app switch. "Edit", "Save" and "Cancel" come from the
 *           `ui` catalogue.
 * Runtime: react-native
 * Governing contract: gap inventory row 5 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3); ADR 0055
 *          (forms: one field contract); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 3.3.1, 4.1.2.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import { FIELD_RADIUS_CLASS_NAME } from "#core/constants/field-radius-class-name.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import type { InlineEditProps } from "#native/inline-edit/inline-edit.props";
import { Text } from "#native/text/text";
import { TextField } from "#native/text-field/text-field";

const FAST = motionTiming(STACKRA_THEME, "fast");
const REVEAL = motionTiming(STACKRA_THEME, "reveal");
const FADE_IN = FadeIn.duration(FAST.durationMs).reduceMotion(ReduceMotion.System);
const FADE_OUT = FadeOut.duration(FAST.durationMs).reduceMotion(ReduceMotion.System);

/** A value the user edits in place; `onChange` receives the text when it is saved. */
export function InlineEdit({
  label,
  description,
  errorMessage,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  name: _name,
  validate,
  placeholder,
  editLabel,
  saveLabel,
  cancelLabel,
  className,
  accessibilityLabel,
}: InlineEditProps): ReactElement {
  const t = useUiText();
  const [own, setOwn] = useState(defaultValue ?? "");
  const saved = value ?? own;
  // `null` is read mode; text is the draft being edited.
  const [draft, setDraft] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | undefined>();
  const isReduced = useReducedMotion();
  const flash = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const fieldName = accessibilityLabel ?? (typeof label === "string" ? label : undefined);

  const close = () => {
    setProblem(undefined);
    setDraft(null);
  };
  const save = () => {
    if (draft === null) return;
    const message = validate?.(draft);
    if (message) {
      haptics.play("error");
      return setProblem(message);
    }
    if (draft !== saved) {
      if (value === undefined) setOwn(draft);
      onChange?.(draft);
      haptics.play("success");
      if (!isReduced) {
        flash.set(
          withSequence(
            withTiming(0.24, { duration: 0 }),
            withTiming(0, { duration: REVEAL.durationMs * 2 }),
          ),
        );
      }
    }
    close();
  };

  return (
    <View className={["gap-1", className].filter(Boolean).join(" ")}>
      {label == null ? null : (
        <Text type="small" tone="muted">
          {label}
        </Text>
      )}
      {draft === null ? (
        <Animated.View key="read" entering={FADE_IN} exiting={FADE_OUT}>
          <Pressable
            disabled={Boolean(isDisabled)}
            onPress={() => (isReadOnly ? undefined : setDraft(saved))}
            accessibilityRole="button"
            accessibilityLabel={[editLabel ?? t(UI_KEYS.ui.inline_edit.edit), fieldName]
              .filter(Boolean)
              .join(", ")}
            accessibilityValue={{ text: saved }}
            accessibilityState={{ disabled: Boolean(isDisabled || isReadOnly) }}
            className={`min-h-12 flex-row items-center justify-between gap-2 overflow-hidden px-3 ${FIELD_RADIUS_CLASS_NAME}`}
          >
            <Animated.View
              pointerEvents="none"
              style={flashStyle}
              className="absolute inset-0 bg-success"
            />
            <Text tone={saved === "" ? "muted" : "default"} numberOfLines={1}>
              {saved === "" ? placeholder : saved}
            </Text>
            {isReadOnly ? null : <Icon name="pencil" size="sm" tone="muted" />}
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View
          key="edit"
          entering={FADE_IN}
          exiting={FADE_OUT}
          className="flex-row items-start gap-1"
        >
          <View className="min-w-0 flex-1">
            <TextField
              {...(fieldName === undefined ? {} : { accessibilityLabel: fieldName })}
              // oxlint-disable-next-line jsx-a11y/no-autofocus -- reason: the field opens because the user just asked to edit; it takes the focus
              autoFocus
              value={draft}
              onChange={(next: string) => {
                setDraft(next);
                setProblem(undefined);
              }}
              onSubmitEditing={save}
              returnKeyType="done"
              isInvalid={Boolean(problem) || Boolean(isInvalid)}
              {...((problem ?? errorMessage) ? { errorMessage: problem ?? errorMessage } : {})}
              {...(isRequired === undefined ? {} : { isRequired })}
              {...(placeholder === undefined ? {} : { placeholder })}
            />
          </View>
          <IconButton
            icon="check"
            variant="primary"
            size="sm"
            label={saveLabel ?? t(UI_KEYS.ui.inline_edit.save)}
            onPress={save}
          />
          <IconButton
            icon="x"
            variant="ghost"
            size="sm"
            label={cancelLabel ?? t(UI_KEYS.ui.inline_edit.cancel)}
            onPress={close}
          />
        </Animated.View>
      )}
      {description == null ? null : (
        <Text type="small" tone="muted">
          {description}
        </Text>
      )}
    </View>
  );
}
