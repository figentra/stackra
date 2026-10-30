/**
 * Stackra file contract:
 * Purpose: the ONE component screen of the mobile showcase (replaces the 124 per-component screens): reads
 *          `{ tier, slug, tab?, example? }`, looks the entry up in @stackra/showcase, sets the native title, and
 *          draws the hero (status and platform chips, headline and intro, tags, suggest link; STA-1371) over the swipeable tab pages
 *          Preview · Usage · API (· Hooks) · Docs. The selected tab is the `tab` param, so `?tab=api` deep links and
 *          the tabs both drive it; sibling hops are `setParams`, never `replace` (no header capsule re-mount).
 * Boundary: composition only; the data is the registry, the demos the generated map, the words the catalogues.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) sections 1, 2.2, 3.3 and 4; ADR 0320.
 */
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { I18nKey } from "@stackra/i18n";
import { bySlug, type ComponentEntry, componentKeys, DocTab, docKeys } from "@stackra/showcase";
import { Chip, Text, useCatalogueText } from "@stackra/ui/native";
import { type ReactNode, useLayoutEffect, useMemo } from "react";
import { View } from "react-native";

import { ApiTab } from "#src/components/doc-screen/api-tab";
import type { DocPage } from "#src/components/doc-screen/doc-page.type";
import { docTabItems } from "#src/components/doc-screen/doc-tab-items.function";
import { DocHero } from "#src/components/doc-screen/doc-hero";
import { DocTabs } from "#src/components/doc-screen/doc-tabs";
import { DocsTab } from "#src/components/doc-screen/docs-tab";
import { HooksTab } from "#src/components/doc-screen/hooks-tab";
import { PreviewPager } from "#src/components/doc-screen/preview-pager";
import { UsageTab } from "#src/components/doc-screen/usage-tab";
import { ReviewIcons } from "#src/components/ui/review-icons";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";
import { DEMOS } from "#src/demos/index.generated";
import type { HomeStackParamList } from "#src/navigation/types";
import type { ComponentScreenProps } from "#src/screens/component-screen.props";

/** The showcase words' keys. */
const K = SHOWCASE_KEYS.showcase;

/** The page a `tab` param names, Preview by default. */
function pageOf(tab: string | undefined): DocPage {
  return DocTab.includes(tab as DocTab) ? (tab as DocTab) : "preview";
}

/** The one component screen. */
export function ComponentScreen({ route }: ComponentScreenProps) {
  const { tier, slug, tab, example } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, "Component">>();
  const t = useCatalogueText(MESSAGES.en);
  const entry = bySlug(tier, slug);
  const key = `${tier}/${slug}`;
  const demos = DEMOS[key];
  const api = useMemo(() => demos?.api?.(), [demos]);
  const words = entry ? componentKeys(entry) : undefined;
  const doc = entry ? docKeys(entry) : undefined;

  useLayoutEffect(() => {
    navigation.setOptions({ title: words ? t(words.title as I18nKey) : slug });
  }, [navigation, words, slug, t]);

  if (!entry || !words || !doc) {
    return (
      <Text tone="muted" className="p-4">
        {t(K.ui.planned_note)}
      </Text>
    );
  }

  const open = (next: ComponentEntry) =>
    navigation.setParams({ tier: next.tier, slug: next.slug, tab: "preview", example: undefined });
  const push = (next: ComponentEntry) =>
    navigation.push("Component", { tier: next.tier, slug: next.slug });
  const onPageChange = (page: DocPage) => {
    if (DocTab.includes(page as DocTab)) navigation.setParams({ tab: page as DocTab });
  };

  const content: Record<DocPage, ReactNode> = {
    preview: (
      <PreviewPager
        // A new component starts its pager at its first example, so "View code" never names the last one's.
        key={key}
        entry={entry}
        demos={demos}
        onViewCode={(id) => navigation.setParams({ tab: "usage", example: id })}
      />
    ),
    usage: <UsageTab entry={entry} demos={demos} example={example} />,
    api: <ApiTab api={api} />,
    hooks: api?.hooks ? <HooksTab hooks={api.hooks} entryKey={api.key} /> : null,
    docs: <DocsTab entry={entry} api={api} demos={demos} onPush={push} onReplace={open} />,
  };
  const pages = docTabItems(Boolean(api?.hooks?.length), t).map((item) => ({
    ...item,
    content: content[item.id],
  }));

  return (
    // The demos draw their icons by name, from the review area's registry like the home's.
    <ReviewIcons>
      <View className="flex-1 bg-background">
        <View className="px-4 pb-3 pt-2">
          <DocHero
            page={t(words.title as I18nKey)}
            chips={
              <>
                <Chip size="sm" variant="soft" tone="accent">
                  {t(K.status[entry.status ?? "stable"])}
                </Chip>
                {entry.platforms.length === 1 && entry.platforms[0] ? (
                  <Chip size="sm" variant="soft">
                    {t(K.platform_only[entry.platforms[0]])}
                  </Chip>
                ) : null}
              </>
            }
            headline={t(doc.fields.headline as I18nKey)}
            intro={t(doc.fields.intro as I18nKey)}
            introLines={3}
            tags={t(doc.fields.tags as I18nKey)}
          />
        </View>
        <DocTabs
          pages={pages}
          page={pageOf(tab)}
          onPageChange={onPageChange}
          label={t(words.title as I18nKey)}
        />
      </View>
    </ReviewIcons>
  );
}
