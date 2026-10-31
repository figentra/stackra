/**
 * Stackra file contract:
 * Purpose: the native `SourceChip`: one citation of an AI answer as a 20 px pill on the default fill: its favicon (or
 *          letter, or a document mark) and its title. A web source is a link that opens in the system browser; its
 *          `description` is read as the hint.
 * Boundary: only `http:` and `https:` links are followed (`sourceLinkOf`), so a model's `javascript:` URL is shown as
 *           a document. Phones have no hover, so there is no preview card. Colours and radius are tokens.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.4.4; STA-1371 (component gaps,
 *          owner approval 2026-10-31).
 */
import type { ReactElement } from "react";
import { Linking, Pressable, View } from "react-native";

import { AI_PARTS_KEYS } from "#core/constants/ai-parts-keys.constant";
import { sourceLinkOf } from "#core/functions/source-link-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { SourceMark } from "#native/sources/source-mark";
import type { SourceChipProps } from "#native/sources/source-chip.props";
import { Text } from "#native/text/text";

/** The chip's look: a 20 px pill. */
const PILL =
  "h-5 max-w-60 flex-row items-center gap-1 self-start rounded-[var(--radius-pill)] bg-default ps-0.5 pe-2";

/** One citation. */
export function SourceChip({ source, className }: SourceChipProps): ReactElement {
  const t = useUiText();
  const { href, title } = sourceLinkOf(source);
  const content = (
    <>
      <SourceMark source={source} />
      <Text type="caption" tone="muted" numberOfLines={1} className="shrink">
        {title}
      </Text>
    </>
  );
  const hint = source.description ? { accessibilityHint: source.description } : {};
  if (href === undefined) {
    return (
      <View
        accessible
        accessibilityLabel={`${title}, ${t(AI_PARTS_KEYS.ui.sources.document)}`}
        {...hint}
        className={`${PILL} ${className ?? ""}`}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={title}
      {...hint}
      onPress={() => void Linking.openURL(href)}
      className={`${PILL} active:opacity-70 ${className ?? ""}`}
    >
      {content}
    </Pressable>
  );
}
