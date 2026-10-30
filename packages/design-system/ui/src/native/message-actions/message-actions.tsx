/**
 * Stackra file contract:
 * Purpose: the native `MessageActions`: the row of icon buttons under an assistant's message: Copy (the CopyButton),
 *          Retry, Edit, and a thumbs up and a thumbs down that toggle (pressing the pressed one clears it). Each is drawn
 *          only when its prop is set.
 * Boundary: a `toolbar` row; the thumbs are ToggleButtons, so their checked state is read out.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; STA-1371 (wave D, owner approval 2026-10-30).
 */
import { IconRegistryProvider } from "@stackra/icons/native";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import type { MessageFeedback } from "#contracts/enums/message-feedback.enum";
import { AI_CHAT_KEYS } from "#core/constants/ai-chat-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { CopyButton } from "#native/copy-button/copy-button";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { MESSAGE_ACTIONS_ICONS } from "#native/message-actions/message-actions-icons.constant";
import type { MessageActionsProps } from "#native/message-actions/message-actions.props";
import { ToggleButton } from "#native/toggle-button/toggle-button";

/** The row's words. */
const K = AI_CHAT_KEYS.ui.message_actions;

/** The actions under an assistant's message. */
export function MessageActions({
  copyValue,
  onCopy,
  onRetry,
  onEdit,
  feedback: feedbackProp,
  onFeedbackChange,
  label,
  className,
}: MessageActionsProps): ReactElement {
  const t = useUiText();
  const [ownFeedback, setOwnFeedback] = useState<MessageFeedback | null>(null);
  const feedback = feedbackProp === undefined ? ownFeedback : feedbackProp;
  const rate = (value: MessageFeedback, isPressed: boolean) => {
    const next = isPressed ? value : null;
    setOwnFeedback(next);
    onFeedbackChange?.(next);
  };
  const thumb = (value: MessageFeedback) => (
    <ToggleButton
      isIconOnly
      size="sm"
      variant="ghost"
      label={t(value === "up" ? K.good : K.bad)}
      isSelected={feedback === value}
      onChange={(isPressed) => rate(value, isPressed)}
    >
      <Icon name={value === "up" ? "thumbs-up" : "thumbs-down"} size="sm" />
    </ToggleButton>
  );
  return (
    <IconRegistryProvider registry={MESSAGE_ACTIONS_ICONS}>
      <View
        accessibilityRole="toolbar"
        accessibilityLabel={label ?? t(K.label)}
        className={`flex-row items-center gap-0.5 ${className ?? ""}`}
      >
        {copyValue === undefined ? null : (
          <CopyButton
            value={copyValue}
            label={t(K.copy)}
            size="sm"
            {...(onCopy ? { onCopy } : {})}
          />
        )}
        {onRetry ? (
          <IconButton
            icon="rotate-ccw"
            label={t(K.retry)}
            size="sm"
            variant="ghost"
            onPress={onRetry}
          />
        ) : null}
        {onEdit ? (
          <IconButton icon="pencil" label={t(K.edit)} size="sm" variant="ghost" onPress={onEdit} />
        ) : null}
        {onFeedbackChange ? (
          <>
            {thumb("up")}
            {thumb("down")}
          </>
        ) : null}
      </View>
    </IconRegistryProvider>
  );
}
