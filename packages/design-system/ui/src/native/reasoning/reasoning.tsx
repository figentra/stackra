/**
 * Stackra file contract:
 * Purpose: the native `Reasoning`: the assistant's reasoning and agent steps behind a quiet trigger ("Thought for 4s")
 *          that shimmers while it runs; open, a vertical trace of steps, each a dot on a line with an optional label
 *          above its body.
 * Boundary: the kit's Disclosure (its header reads expanded or collapsed) and Shimmer; the steps are a `list`. The line
 *           and padding are logical, so the trace sits on the right in Arabic. String bodies are drawn in the kit's
 *           Text. It depends on no AI SDK.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371 (component gaps, owner approval
 *          2026-10-31).
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { AI_PARTS_KEYS } from "#core/constants/ai-parts-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Disclosure } from "#native/disclosure/disclosure";
import type { ReasoningProps } from "#native/reasoning/reasoning.props";
import { Shimmer } from "#native/shimmer/shimmer";
import { Text } from "#native/text/text";

/** The trace's words. */
const K = AI_PARTS_KEYS.ui.reasoning;

/** The assistant's reasoning, folded. */
export function Reasoning({
  steps,
  summary,
  isStreaming = false,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  className,
}: ReasoningProps): ReactElement {
  const t = useUiText();
  return (
    <Disclosure
      title={
        isStreaming ? (
          <Shimmer>{summary}</Shimmer>
        ) : (
          <Text type="small" tone="muted">
            {summary ?? t(K.summary)}
          </Text>
        )
      }
      {...omitUndefined({ isExpanded, defaultExpanded, onExpandedChange, className })}
    >
      <View
        accessibilityRole="list"
        accessibilityLabel={t(K.steps)}
        className="gap-2 border-s border-separator ps-3"
      >
        {steps.map((step) => (
          <View key={step.key} className="relative gap-1">
            <View className="absolute top-2 -start-3.75 size-1.5 rounded-[var(--radius-pill)] bg-muted" />
            {step.label ? (
              <Text type="small" tone="muted" className="font-medium">
                {step.label}
              </Text>
            ) : null}
            {typeof step.content === "string" ? (
              <Text type="small">{step.content}</Text>
            ) : (
              step.content
            )}
          </View>
        ))}
      </View>
    </Disclosure>
  );
}
