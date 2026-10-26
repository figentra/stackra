/**
 * Stackra file contract:
 * Purpose: the native `AiMark`: the sparkles mark beside an AI-capable action, on a record an agent changed, or on
 *          AI-generated content, with its label read out, and shown when asked.
 * Boundary: draws a mark only; whether to draw it is derived by the caller (ADR 0360 decision 11). With the label
 *           hidden the icon carries it as its accessible name; shown, the icon is decorative and the `Text` is read.
 * Runtime: react-native
 * Governing contract: ADR 0360 (decision 11); ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1.
 */
import { View } from "react-native";
import type { ReactElement } from "react";

import { Icon } from "#native/icon/icon";
import { Text } from "#native/text/text";
import type { AiMarkProps } from "#native/ai-mark/ai-mark.props";

/** The AI mark, labelled. */
export function AiMark({ kind, label, isLabelVisible, size = "sm" }: AiMarkProps): ReactElement {
  return (
    <View testID={`ai-mark-${kind}`} className="flex-row items-center gap-1">
      <Icon name="sparkles" size={size} tone="accent" label={isLabelVisible ? undefined : label} />
      {isLabelVisible ? (
        <Text type="caption" tone="accent">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
