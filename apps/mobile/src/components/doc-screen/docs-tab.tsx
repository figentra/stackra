/**
 * Stackra file contract:
 * Purpose: the Docs tab of the mobile component screen: the what/when/how pillars, the guidance (when not, do and
 *          don't, anatomy, alternatives; STA-1371), the HeroUI links (docs, source, Figma; hidden when the registry has
 *          no URL), the styling slots, the accessibility notes, the Stackra section (tokens, RTL note and flipped
 *          preview, haptics), the related cards and the previous/next pager.
 * Boundary: presentation only; links open through `Link` (the system browser) after a selection haptic.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (rows 2, 7, 8, 10 to 12) and section 6.
 */
import type { I18nKey } from "@stackra/i18n";
import { docKeys, lookupMessage } from "@stackra/showcase";
import { Link, Text, useCatalogueText, useHaptic } from "@stackra/ui/native";
import { useContext } from "react";
import { ScrollView, View } from "react-native";
import { BottomTabBarHeightContext } from "react-native-bottom-tabs";

import { DocPager } from "#src/components/doc-screen/doc-pager";
import { DOC_KEYS } from "#src/components/doc-screen/doc-keys.constant";
import { GuidanceSection } from "#src/components/doc-screen/guidance-section";
import { PillarBand } from "#src/components/doc-screen/pillar-band";
import type { DocsTabProps } from "#src/components/doc-screen/docs-tab.props";
import { RelatedCards } from "#src/components/doc-screen/related-cards";
import { StackraSection } from "#src/components/doc-screen/stackra-section";
import { Section } from "#src/components/ui/section";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/** The showcase words' keys. */
const K = SHOWCASE_KEYS.showcase;

/** Code tokens keep the Latin reading direction. */
const LTR = { writingDirection: "ltr" } as const;

/** Links, styling, accessibility, Stackra, related and the pager. */
export function DocsTab({ entry, api, demos, onPush, onReplace }: DocsTabProps) {
  const t = useCatalogueText(MESSAGES.en);
  // Clear the floating tab bar: the last section scrolls fully above it (0 outside the tab navigator).
  const tabBar = useContext(BottomTabBarHeightContext) ?? 0;
  const { play } = useHaptic();
  const hero = entry.hero.native;
  const doc = docKeys(entry);
  const say = (key: string) => t(key as I18nKey);
  const links = hero
    ? [
        { key: K.link.hero_docs, href: hero.docsUrl },
        { key: K.link.source, href: hero.sourceUrl },
        { key: K.link.figma, href: hero.figmaUrl },
      ].filter((link) => link.href !== undefined)
    : [];
  const a11y = (entry.a11y ?? [])
    .map(
      (key) =>
        lookupMessage(MESSAGES.en.showcase, `showcase::a11y.${key}`) && `showcase::a11y.${key}`,
    )
    .filter((key) => typeof key === "string");

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: tabBar + 32 }}
      contentContainerClassName="gap-6 p-4"
    >
      <PillarBand
        what={say(doc.fields.what)}
        when={say(doc.fields.when)}
        how={`${t(DOC_KEYS.showcase.doc.ui.how_native)} ${say(doc.fields.rtl)} ${t(DOC_KEYS.showcase.doc.ui.tokens_count, { count: entry.tokens.length })}`}
      />
      <GuidanceSection entry={entry} onPush={onPush} />
      {links.length > 0 ? (
        <Section title={t(K.section.links)}>
          <View className="gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                isExternal
                underline="hover"
                onPress={() => play("selection")}
              >
                {t(link.key)}
              </Link>
            ))}
          </View>
        </Section>
      ) : null}
      {api?.slots && api.slots.length > 0 ? (
        <Section title={t(K.section.styling)}>
          {api.slots.map((slot) => (
            <View key={slot.name} className="gap-0.5">
              <Text className="font-mono" style={LTR}>
                {slot.name}
              </Text>
              <Text type="small" tone="muted">
                {slot.description}
              </Text>
            </View>
          ))}
        </Section>
      ) : null}
      {a11y.length > 0 ? (
        <Section title={t(K.section.accessibility)}>
          {a11y.map((key) => (
            <Text key={key} type="small">
              {t(key as Parameters<typeof t>[0])}
            </Text>
          ))}
        </Section>
      ) : null}
      <StackraSection entry={entry} demos={demos} />
      {entry.related.length > 0 ? (
        <Section title={t(K.section.related)}>
          <RelatedCards keys={entry.related} onOpen={onPush} />
        </Section>
      ) : null}
      <DocPager entry={entry} onOpen={onReplace} />
    </ScrollView>
  );
}
