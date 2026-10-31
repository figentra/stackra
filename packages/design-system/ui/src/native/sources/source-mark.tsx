/**
 * Stackra file contract:
 * Purpose: `SourceMark`, the 14 px mark at the start of a native source chip: the site's favicon, the title's letter
 *          when there is none (or it fails to load), or a document icon.
 * Boundary: decorative (hidden from assistive technology); the chip carries the name. Internal to SourceChip and
 *           Sources.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { useState, type ReactElement } from "react";
import { Image, View } from "react-native";

import type { SourceItem } from "#contracts/types/source-item.type";
import { sourceLinkOf } from "#core/functions/source-link-of.function";
import { Icon } from "#native/icon/icon";
import { Text } from "#native/text/text";

/** A source's favicon, letter or document mark. */
export function SourceMark({ source }: { readonly source: SourceItem }): ReactElement {
  const [isBroken, setBroken] = useState(false);
  const { href, letter } = sourceLinkOf(source);
  const hidden = {
    accessibilityElementsHidden: true,
    importantForAccessibility: "no-hide-descendants",
  } as const;
  if (href === undefined) {
    return (
      <View {...hidden}>
        <Icon name="file-text" size="sm" />
      </View>
    );
  }
  if (source.faviconSrc && !isBroken) {
    return (
      <Image
        {...hidden}
        source={{ uri: source.faviconSrc }}
        onError={() => setBroken(true)}
        className="size-3.5 rounded-[var(--radius-pill)] bg-surface"
      />
    );
  }
  return (
    <View
      {...hidden}
      className="size-3.5 items-center justify-center rounded-[var(--radius-pill)] bg-foreground"
    >
      <Text type="caption" className="text-[0.7em] leading-none font-semibold text-background">
        {letter}
      </Text>
    </View>
  );
}
