/**
 * Stackra file contract:
 * Purpose: the native `TamoFieldAssist`: Tamo inside a text field: the icon-only `TamoMenu` at the input's end once
 *          the field has had focus, then the chosen action's preview under it: a draft box for an empty field, the
 *          draft review for a text action, or ghost text for "Continue writing".
 * Boundary: internal to the native TextField and TextArea. Nothing reaches the field until the person accepts
 *           (ADR 0021); Stop and Discard leave it as it was.
 * Runtime: react-native
 * Governing contract: ADR 0507 (decisions 1, 2 and 6: icons on focus inside fields); ADR 0021.
 */
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useTamoTask } from "#react/hooks/use-tamo-task";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { TamoAskBox } from "#native/tamo-ask-box/tamo-ask-box";
import { TamoDraftReview } from "#native/tamo-draft-review/tamo-draft-review";
import { TamoGhostText } from "#native/tamo-ghost-text/tamo-ghost-text";
import { TamoMenu } from "#native/tamo-menu/tamo-menu";
import { TamoStatusLine } from "#native/tamo-status-line/tamo-status-line";
import { Text } from "#native/text/text";
import type { TamoFieldAssistProps } from "#native/tamo-field-assist/tamo-field-assist.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** Tamo's menu and preview around a field's input. */
export function TamoFieldAssist({
  slot,
  field,
  text,
  onAccept,
  isShown,
  hasContinue = false,
  children,
}: TamoFieldAssistProps): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const task = useTamoTask<string>();
  const [mode, setMode] = useState<"draft" | "review" | "ghost" | null>(null);
  const done = () => {
    task.reset();
    setMode(null);
  };
  const accept = (next: string) => {
    onAccept(next);
    done();
  };
  const choose = (action: string) => {
    if (action === "draft") return setMode("draft");
    setMode(action === "continue" ? "ghost" : "review");
    task.run((signal) =>
      action === "continue"
        ? slot.run("continue", { text, locale, field }, signal)
        : slot.run("transform", { text, action, locale, field }, signal),
    );
  };
  return (
    <>
      <View className="flex-row items-end gap-2">
        <View className="flex-1">{children}</View>
        {isShown ? (
          <TamoMenu
            isIconOnly
            text={text}
            hasContinue={hasContinue}
            actions={slot.actions}
            status={task.status}
            onAction={choose}
          />
        ) : null}
      </View>
      {mode === "draft" ? (
        <TamoAskBox
          label={t(K.draft)}
          placeholder={t(K.draft_placeholder)}
          isAutoFocus
          onAsk={(prompt, signal) => slot.run("draft", { prompt, locale, field }, signal)}
          renderProposal={(draft) => <Text type="small">{draft}</Text>}
          onApply={accept}
          onDiscard={done}
        />
      ) : null}
      {mode === "review" ? (
        <TamoDraftReview
          before={text}
          after={task.result ?? ""}
          status={task.status}
          onAccept={accept}
          onDiscard={done}
          onStop={done}
          onRetry={task.retry}
        />
      ) : null}
      {mode === "ghost" ? (
        task.status === "ready" ? (
          <TamoGhostText
            value={text}
            suggestion={task.result ?? ""}
            onAccept={accept}
            onDismiss={done}
          >
            {null}
          </TamoGhostText>
        ) : (
          <TamoStatusLine status={task.status} onStop={done} onRetry={task.retry} />
        )
      ) : null}
    </>
  );
}
