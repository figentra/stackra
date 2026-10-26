/**
 * Stackra file contract:
 * Purpose: the native `AssistantPanel`: the sidekick's screen or sheet: a header with the assistant's name as a heading,
 *          its AI label and actions, the conversation filling the middle, and the composer under it.
 * Boundary: layout only; the conversation and composer are the caller's (`ChatConversation`, `PromptInput` or their
 *           native counterparts). The heading is `@stackra/ui`'s `Heading` (announced as a header), and the AI label is
 *           its `AiMark`, shown. A string title is drawn inside the heading; React Native refuses a bare string in a
 *           `View`. Keyboard avoidance is the screen's (`Screen`), so the panel nests in any layout.
 * Runtime: react-native
 * Governing contract: ADR 0360 (decisions 1 and 11); ADR 0310 (decision 3); ADR 0303 (decision 7).
 */
import { AiMark, Heading } from "@stackra/ui/native";
import type { ReactElement } from "react";
import { View } from "react-native";

import type { AssistantPanelContractProps } from "#contracts/types/assistant-panel-contract-props.type";

/** Props of the native AssistantPanel. */
export type AssistantPanelProps = AssistantPanelContractProps;

/** The assistant's panel. */
export function AssistantPanel({
  title,
  disclosure,
  headerActions,
  children,
  composer,
}: AssistantPanelProps): ReactElement {
  return (
    <View testID="assistant-panel" className="min-h-0 flex-1">
      <View className="flex-row items-center justify-between gap-2 border-b border-separator px-4 py-3">
        <View className="min-w-0 flex-1 gap-1">
          <Heading level={2} type="h6" isTruncated>
            {title}
          </Heading>
          {disclosure === undefined ? null : (
            <AiMark kind="generated" label={disclosure} isLabelVisible />
          )}
        </View>
        {headerActions == null ? null : (
          <View className="flex-row items-center gap-1">{headerActions}</View>
        )}
      </View>
      <View testID="assistant-panel-conversation" className="min-h-0 flex-1">
        {children}
      </View>
      <View testID="assistant-panel-composer" className="border-t border-separator p-3">
        {composer}
      </View>
    </View>
  );
}
