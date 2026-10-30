/**
 * Stackra file contract:
 * Purpose: one row of the API tab: the prop name (mono), its type (mono, wrapping), the default and required chips,
 *          the source chip (Stackra, HeroUI or React Aria), the description in the locale (with a machine-translation
 *          mark), the `replaces` footnote and the deprecation note.
 * Boundary: one presentational component; names, types and defaults are never translated and stay left to right.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 3.3 (API) and 7.4 (never translated).
 */
import type { Tone } from "@stackra/contracts";
import { codeSpans } from "@stackra/showcase";
import apiAr from "@stackra/showcase/assets/lang/ar/api.json";
import { Bidi, Chip, Text, useCatalogueText, useDesignSystem } from "@stackra/ui/native";
import { View } from "react-native";

import { apiDescription } from "#src/components/doc-screen/api-description.function";
import type { PropCardProps } from "#src/components/doc-screen/prop-card.props";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/** The API words' keys. */
const K = SHOWCASE_KEYS.showcase.api;

/** Code tokens keep the Latin reading direction. */
/** English standing in for Arabic sits on the left edge; its order comes from a left-to-right isolate (`Bidi`). */
const LEFT = { textAlign: "left" } as const;

/** The chip tone and label key of each source. */
const SOURCE = {
  stackra: { tone: "accent", key: K.source.stackra },
  heroui: { tone: "default", key: K.source.heroui },
  "react-aria": { tone: "success", key: K.source.react_aria },
} as const satisfies Record<string, { tone: Tone; key: unknown }>;

/** One prop of a part. */
export function PropCard({ prop, entryKey, part, hasDefault = true }: PropCardProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { locale } = useDesignSystem();
  const { text, isMachine, isFallback } = apiDescription(prop, entryKey, part, locale, apiAr);
  const source = SOURCE[prop.source];
  return (
    <View className="gap-1 py-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="font-mono font-semibold">
          <Bidi dir="ltr">{prop.name}</Bidi>
        </Text>
        {prop.required ? (
          <Chip size="sm" variant="soft" tone="danger">
            {t(K.required)}
          </Chip>
        ) : null}
        {hasDefault && prop.default !== undefined ? (
          <Chip size="sm" variant="soft" startIcon="equal">
            <Text type="caption" className="font-mono">
              <Bidi dir="ltr">{prop.default}</Bidi>
            </Text>
          </Chip>
        ) : null}
        <Chip size="sm" variant="soft" tone={source.tone}>
          {t(source.key)}
        </Chip>
      </View>
      {/* iOS lays a Text out in the screen's direction whatever its writingDirection, so code is an LTR isolate:
          a wrapped union keeps "a" | "b" in order instead of reversing in Arabic. */}
      <Text type="small" tone="muted" className="self-start font-mono">
        <Bidi dir="ltr">{prop.type}</Bidi>
      </Text>
      {text ? (
        <Text type="small" style={isFallback ? LEFT : undefined}>
          <Bidi dir={isFallback ? "ltr" : "auto"}>
            {codeSpans(text).map((span, index) =>
              span.isCode ? (
                // An isolate keeps the code's own order and its neighbours' punctuation where it belongs.
                // oxlint-disable-next-line react/no-array-index-key -- the spans are one fixed split of a single string, so their position is their identity
                <Bidi key={index} dir="ltr">
                  {span.text}
                </Bidi>
              ) : (
                span.text
              ),
            )}
          </Bidi>
        </Text>
      ) : null}
      {isMachine ? (
        <Text type="caption" tone="muted">
          {t(K.machine_translation)}
        </Text>
      ) : null}
      {prop.replaces ? (
        <Text type="caption" tone="muted">
          {t(K.replaces, { prop: prop.replaces })}
        </Text>
      ) : null}
      {prop.deprecated ? (
        <Chip size="sm" variant="soft" tone="warning">
          {t(K.deprecated)}
        </Chip>
      ) : null}
    </View>
  );
}
