/**
 * Stackra file contract:
 * Purpose: the native `AiMark`: Tamo's mark (`TamoMark`, ADR 0507 decision 4) beside an AI-capable action, on a record an agent changed, or on
 *          AI-generated content, with its label read out, and shown when asked.
 * Boundary: draws a mark only; whether to draw it is derived by the caller (ADR 0360 decision 11). With the label
 *           hidden the mark carries it as its accessible name; shown, the mark is decorative and the `Text` is read.
 * Runtime: react-native
 * Governing contract: ADR 0360 (decision 11); ADR 0507 (decision 4); ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1.
 */
import { View } from "react-native";
import type { ReactElement } from "react";

import { TamoMark } from "#native/tamo-mark/tamo-mark";
import { Text } from "#native/text/text";
import type { AiMarkProps } from "#native/ai-mark/ai-mark.props";

/** The AI mark, labelled. */
export function AiMark({ kind, label, isLabelVisible, size = "sm" }: AiMarkProps): ReactElement {
  return (
    <View testID={`ai-mark-${kind}`} className="flex-row items-center gap-1">
      <TamoMark size={size} {...(isLabelVisible ? {} : { label })} />
      {isLabelVisible ? (
        <Text type="caption" tone="accent">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
