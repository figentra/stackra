/**
 * Stackra file contract:
 * Purpose: the native `TamoAskBox`: the "ask in words" box. The person writes (or pastes) what they want, Tamo works
 *          (shimmer, Stop), and the structured proposal is drawn under it with Apply and Discard; nothing found says
 *          so; an error offers Try again.
 * Boundary: the proposal is the caller's to draw and apply (ADR 0021); the box holds only the words and the task. A
 *           single-line box sends on the keyboard's submit key.
 * Runtime: react-native
 * Governing contract: ADR 0507 (ask in words); WCAG 2.2 SC 3.3.2, 4.1.3.
 */
import { Input, TextArea, TextField } from "heroui-native";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useTamoTask } from "#react/hooks/use-tamo-task";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { TamoButton } from "#native/tamo-button/tamo-button";
import { TamoStatusLine } from "#native/tamo-status-line/tamo-status-line";
import { Text } from "#native/text/text";
import type { TamoAskBoxProps } from "#native/tamo-ask-box/tamo-ask-box.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** Ask Tamo in words; review its proposal. */
export function TamoAskBox<TProposal>({
  onAsk,
  renderProposal,
  onApply,
  onDiscard,
  label,
  placeholder,
  isMultiline = false,
  isAutoFocus = false,
  className,
}: TamoAskBoxProps<TProposal>): ReactElement {
  const t = useUiText();
  const [text, setText] = useState("");
  const task = useTamoTask<TProposal | null>();
  const name = label ?? t(K.ask);
  const send = () => {
    const words = text.trim();
    if (words !== "") task.run((signal) => onAsk(words, signal));
  };
  // HeroUI Native's own fields, not the house ones: the house fields carry Tamo themselves (a cycle, and no Tamo in Tamo).
  const field = {
    accessibilityLabel: name,
    value: text,
    onChangeText: setText,
    placeholder: placeholder ?? t(K.ask_placeholder),
    autoFocus: isAutoFocus,
  };
  return (
    <View testID="tamo-ask-box" className={["gap-3", className].filter(Boolean).join(" ")}>
      <TextField>
        {isMultiline ? (
          <TextArea {...field} numberOfLines={4} />
        ) : (
          <Input {...field} returnKeyType="send" onSubmitEditing={send} />
        )}
      </TextField>
      <TamoButton
        label={name}
        status={task.status}
        isDisabled={text.trim() === "" || task.status === "working"}
        onPress={send}
      />
      <TamoStatusLine status={task.status} onStop={task.stop} onRetry={task.retry} />
      {task.status === "ready" && task.result === null ? (
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {t(K.no_proposal)}
        </Text>
      ) : null}
      {task.status === "ready" && task.result != null ? (
        <View
          accessibilityLabel={t(K.proposal)}
          className="gap-2 rounded-[var(--radius-container)] border border-dashed border-tamo-glow-mid p-3"
        >
          <Text type="caption" className="text-tamo-name">
            {t(K.proposal)}
          </Text>
          {renderProposal(task.result)}
          <View className="flex-row flex-wrap gap-2">
            <Button
              size="sm"
              onPress={() => {
                if (task.result != null) onApply(task.result);
                task.reset();
                setText("");
              }}
            >
              {t(K.apply)}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                task.reset();
                onDiscard?.();
              }}
            >
              {t(K.discard)}
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}
