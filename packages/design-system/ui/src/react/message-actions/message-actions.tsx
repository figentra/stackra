/**
 * Stackra file contract:
 * Purpose: the web `MessageActions`: the row of icon buttons under an assistant's message: Copy (the CopyButton), Retry,
 *          Edit, and a thumbs up and a thumbs down that toggle (pressing the pressed one clears it). Each is drawn only
 *          when its prop is set.
 * Boundary: a HeroUI Toolbar (React Aria), so Tab reaches the row once and the arrow keys move between its buttons in
 *           the reading direction; the thumbs are HeroUI ToggleButtons, so their pressed state is announced.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1, 4.1.2; STA-1371 (wave D, owner approval 2026-10-30).
 */
import { cn, ToggleButton, Toolbar } from "@heroui/react";
import { IconRegistryProvider } from "@stackra/icons/react";
import { useState, type ReactElement } from "react";

import type { MessageFeedback } from "#contracts/enums/message-feedback.enum";
import { AI_CHAT_KEYS } from "#core/constants/ai-chat-keys.constant";
import { CopyButton } from "#react/copy-button/copy-button";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { MESSAGE_ACTIONS_ICONS } from "#react/message-actions/message-actions-icons.constant";
import type { MessageActionsProps } from "#react/message-actions/message-actions.props";

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
      aria-label={t(value === "up" ? K.good : K.bad)}
      isSelected={feedback === value}
      onChange={(isPressed) => rate(value, isPressed)}
    >
      <Icon name={value === "up" ? "thumbs-up" : "thumbs-down"} />
    </ToggleButton>
  );
  return (
    <IconRegistryProvider registry={MESSAGE_ACTIONS_ICONS}>
      <Toolbar
        aria-label={label ?? t(K.label)}
        className={cn("flex items-center gap-0.5 text-muted", className) ?? ""}
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
      </Toolbar>
    </IconRegistryProvider>
  );
}
