/**
 * Stackra file contract:
 * Purpose: the native `PromptInput`: the composer of a chat or agent screen. A multiline box that grows with its text
 *          up to a limit, an attachments row above it, a toolbar of the caller's actions, and one button that sends
 *          (`ready`, `error`), spins (`submitted`) or stops the reply (`streaming`); a muted footer line under it.
 * Boundary: on a phone Return adds a line and the button sends; the text is read-only while a reply runs. The box is
 *           React Native's TextInput named by the label; the button is named for what a press does. Flex rows follow
 *           the layout direction, so it mirrors in Arabic.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 4.1.2; STA-1371 (component gaps,
 *          owner approval 2026-10-31).
 */
import { IconRegistryProvider } from "@stackra/icons/native";
import { useState, type ReactElement } from "react";
import { TextInput, View } from "react-native";

import { AI_PARTS_KEYS } from "#core/constants/ai-parts-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#native/icon-button/icon-button";
import { PROMPT_INPUT_ICONS } from "#native/prompt-input/prompt-input-icons.constant";
import type { PromptInputProps } from "#native/prompt-input/prompt-input.props";
import { Text } from "#native/text/text";

/** The composer's words. */
const K = AI_PARTS_KEYS.ui.prompt_input;

/** The composer of a chat. */
export function PromptInput({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  onStop,
  status = "ready",
  placeholder,
  label,
  isDisabled = false,
  attachments,
  startActions,
  endActions,
  footer,
  className,
}: PromptInputProps): ReactElement {
  const t = useUiText();
  const [own, setOwn] = useState(defaultValue);
  const value = valueProp ?? own;
  const isRunning = status === "submitted" || status === "streaming";
  const canSend = !isDisabled && !isRunning && value.trim() !== "";
  const change = (next: string) => {
    setOwn(next);
    onValueChange?.(next);
  };
  const send = () => {
    if (!canSend) return;
    onSubmit(value.trim());
    if (valueProp === undefined) setOwn("");
  };
  return (
    <View className={`w-full gap-2 ${className ?? ""}`}>
      <View
        className={`rounded-[var(--radius-container)] border border-border bg-surface shadow-field ${isDisabled ? "opacity-50" : ""}`}
      >
        {attachments ? (
          <View className="flex-row flex-wrap gap-2 px-3 pt-3">{attachments}</View>
        ) : null}
        <TextInput
          accessibilityLabel={label ?? t(K.label)}
          placeholder={placeholder ?? t(K.placeholder)}
          value={value}
          multiline
          editable={!isDisabled && !isRunning}
          onChangeText={change}
          className="max-h-60 min-h-14 px-3 pt-3 pb-2 text-base text-foreground"
        />
        <View className="flex-row items-center gap-2 px-2 pb-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-1">{startActions}</View>
          {endActions}
          <IconRegistryProvider registry={PROMPT_INPUT_ICONS}>
            {status === "streaming" ? (
              <IconButton
                icon="square"
                label={t(K.stop)}
                variant="primary"
                size="sm"
                {...(onStop ? { onPress: onStop } : {})}
              />
            ) : (
              <IconButton
                icon="arrow-up"
                label={t(K.send)}
                variant="primary"
                size="sm"
                isLoading={status === "submitted"}
                isDisabled={!canSend}
                onPress={send}
              />
            )}
          </IconRegistryProvider>
        </View>
      </View>
      {footer ? (
        <Text type="caption" tone="muted" align="center">
          {footer}
        </Text>
      ) : null}
    </View>
  );
}
