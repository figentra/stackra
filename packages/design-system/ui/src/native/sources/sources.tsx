/**
 * Stackra file contract:
 * Purpose: the native `Sources`: an answer's citations behind a quiet "3 sources" toggle with up to three stacked marks
 *          (favicons or letters); open, the `SourceChip`s wrap onto lines 8 px apart.
 * Boundary: the kit's Disclosure (its header reads expanded or collapsed); the chips are a `list` named "Sources". The
 *           stacked marks are decorative. Flex rows follow the layout direction, so it mirrors in Arabic.
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
import { SourceChip } from "#native/sources/source-chip";
import { SourceMark } from "#native/sources/source-mark";
import type { SourcesProps } from "#native/sources/sources.props";
import { Text } from "#native/text/text";

/** The list's words. */
const K = AI_PARTS_KEYS.ui.sources;

/** An answer's citations, folded. */
export function Sources({
  sources,
  summary,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  className,
}: SourcesProps): ReactElement {
  const t = useUiText();
  return (
    <Disclosure
      title={
        <View className="flex-row items-center gap-2">
          <View className="flex-row gap-0.5">
            {sources.slice(0, 3).map((source) => (
              <SourceMark key={source.key} source={source} />
            ))}
          </View>
          <Text type="caption" tone="muted" className="font-medium">
            {summary ?? t(K.count, { count: sources.length })}
          </Text>
        </View>
      }
      {...omitUndefined({ isExpanded, defaultExpanded, onExpandedChange, className })}
    >
      <View
        accessibilityRole="list"
        accessibilityLabel={t(K.label)}
        className="flex-row flex-wrap gap-2"
      >
        {sources.map((source) => (
          <SourceChip key={source.key} source={source} />
        ))}
      </View>
    </Disclosure>
  );
}
