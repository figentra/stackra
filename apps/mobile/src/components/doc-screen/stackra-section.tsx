/**
 * Stackra file contract:
 * Purpose: the Stackra section of the Docs tab: the tokens the entry reads as chips, the usage example flipped to
 *          right-to-left in place, and the haptics the entry plays with a "Feel it" button each.
 * Boundary: presentation and the haptic plays; the data is the registry entry. Brands 3-up is out of v1 on native
 *           (the brand theme is app-wide through Uniwind, so three frames cannot differ on one screen).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (row 10) and section 8 (RTL, haptics).
 */
import {
  Button,
  Chip,
  Text,
  useCatalogueText,
  useDesignSystem,
  useHaptic,
} from "@stackra/ui/native";
import type { I18nKey } from "@stackra/i18n";
import { docKeys } from "@stackra/showcase";
import { View } from "react-native";

import type { StackraSectionProps } from "#src/components/doc-screen/stackra-section.props";
import { Section } from "#src/components/ui/section";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";
import { nativeExamples } from "#src/functions/native-examples.function";

/** The Stackra words' keys. */
const K = SHOWCASE_KEYS.showcase;

/** Tokens, the RTL preview and the haptics map. */
export function StackraSection({ entry, demos }: StackraSectionProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { play } = useHaptic();
  const { direction } = useDesignSystem();
  const first = nativeExamples(entry)[0];
  const usage = first ? demos?.examples[first.id] : undefined;
  // The preview shows the other direction, so it is a flip whichever way the app reads.
  const flipped = direction === "rtl" ? "ltr" : "rtl";
  return (
    <>
      {entry.tokens.length > 0 ? (
        <Section title={t(K.stackra.tokens)}>
          <View className="flex-row flex-wrap gap-2">
            {entry.tokens.map((token) => (
              <Chip key={token} size="sm" variant="soft">
                {token}
              </Chip>
            ))}
          </View>
        </Section>
      ) : null}
      {usage ? (
        <Section title={t(K.stackra.rtl)} description={t(docKeys(entry).fields.rtl as I18nKey)}>
          {/* shortcut: `direction` flips layout on iOS only; Android follows I18nManager, so it shows the app's direction. */}
          <View style={{ direction: flipped }}>
            <usage.Demo />
          </View>
        </Section>
      ) : null}
      {entry.haptics && entry.haptics.length > 0 ? (
        <Section title={t(K.stackra.haptics)}>
          {entry.haptics.map(({ event, style }) => (
            <View key={`${event}-${style}`} className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-mono">{event}</Text>
                <Text type="small" tone="muted">
                  {t(K.haptic[style])}
                </Text>
              </View>
              <Button variant="secondary" size="sm" startIcon="hand" onPress={() => play(style)}>
                {t(K.stackra.feel_it)}
              </Button>
            </View>
          ))}
        </Section>
      ) : null}
    </>
  );
}
