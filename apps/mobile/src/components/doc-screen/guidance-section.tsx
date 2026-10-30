/**
 * Stackra file contract:
 * Purpose: the native `GuidanceSection` of the Docs tab, for an entry with a `COMPONENT_DOCS` row: when not to use it,
 *          the do and don't lists, the numbered anatomy parts and the alternatives (cards that push the other entry,
 *          each with the reason to reach for it).
 * Boundary: presentation over `docKeys(entry)`; renders nothing for an entry without a row.
 * Runtime: react-native
 * Governing contract: STA-1371 (doc pages wave, owner approval 2026-10-28).
 */
import type { I18nKey } from "@stackra/i18n";
import { docKeys, type ComponentEntry } from "@stackra/showcase";
import { Chip, Surface, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { DOC_KEYS } from "#src/components/doc-screen/doc-keys.constant";
import { RelatedCards } from "#src/components/doc-screen/related-cards";
import { Section } from "#src/components/ui/section";
import { MESSAGES } from "#src/constants/messages.constant";

const K = DOC_KEYS.showcase.doc.ui;

/** The guidance of `entry`. */
export function GuidanceSection({
  entry,
  onPush,
}: {
  readonly entry: ComponentEntry;
  readonly onPush: (entry: ComponentEntry) => void;
}) {
  const t = useCatalogueText(MESSAGES.en);
  const say = (key: string) => t(key as I18nKey);
  const doc = docKeys(entry);
  if (!doc.whenNot) return null;
  const rules = [
    { id: "do", title: t(K.do), keys: doc.do, edge: "border-success" },
    { id: "dont", title: t(K.dont), keys: doc.dont, edge: "border-danger" },
  ];
  return (
    <Section title={t(K.guidance)}>
      <View className="gap-1">
        <Text className="font-semibold">{t(K.when_not)}</Text>
        <Text type="small">{say(doc.whenNot)}</Text>
      </View>
      {rules.map((rule) => (
        <Surface key={rule.id} className={`gap-1.5 border-s-4 p-3.5 ${rule.edge}`}>
          <Text className="font-semibold">{rule.title}</Text>
          {rule.keys.map((key) => (
            <Text key={key} type="small">
              {`• ${say(key)}`}
            </Text>
          ))}
        </Surface>
      ))}
      {doc.anatomy.length > 0 ? (
        <View className="gap-2">
          <Text className="font-semibold">{t(K.anatomy_parts)}</Text>
          <View className="flex-row flex-wrap gap-2">
            {doc.anatomy.map((part, index) => (
              <Chip key={part.id} size="sm" variant="soft" tone="accent">
                {`${index + 1}. ${say(part.label)}`}
              </Chip>
            ))}
          </View>
        </View>
      ) : null}
      {doc.alternatives.length > 0 ? (
        <View className="gap-2">
          <Text className="font-semibold">{t(K.alternatives)}</Text>
          <RelatedCards
            keys={doc.alternatives.map((alternative) => alternative.key)}
            notes={Object.fromEntries(
              doc.alternatives.map((alternative) => [alternative.key, say(alternative.reason)]),
            )}
            onOpen={onPush}
          />
        </View>
      ) : null}
    </Section>
  );
}
