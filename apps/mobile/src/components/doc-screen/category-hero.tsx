/**
 * Stackra file contract:
 * Purpose: the native `CategoryHero`, the head of one category's page under the home's category tabs: the category's
 *          benefit-led headline, paragraph, tags, "Suggest an improvement" and the what / when / how pillars. The
 *          category's live cards right below it are its signature demos.
 * Boundary: presentation over `showcase::doc.category.<id>.*`.
 * Runtime: react-native
 * Governing contract: STA-1371 (doc pages wave, owner approval 2026-10-28).
 */
import type { I18nKey } from "@stackra/i18n";
import { categoryDocKeys, categoryKeys, type ComponentCategory } from "@stackra/showcase";
import { Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { DocHero } from "#src/components/doc-screen/doc-hero";
import { PillarBand } from "#src/components/doc-screen/pillar-band";
import { MESSAGES } from "#src/constants/messages.constant";

/** The hero of `category`. */
export function CategoryHero({ category }: { readonly category: ComponentCategory }) {
  const t = useCatalogueText(MESSAGES.en);
  const say = (key: string) => t(key as I18nKey);
  const keys = categoryDocKeys(category);
  return (
    <View className="gap-4 pb-2">
      <View className="gap-1">
        <Text type="small" tone="muted" className="font-medium">
          {say(keys.eyebrow)}
        </Text>
        <DocHero
          page={say(categoryKeys(category).title)}
          headline={say(keys.headline)}
          intro={say(keys.intro)}
          tags={say(keys.tags)}
        />
      </View>
      <PillarBand what={say(keys.what)} when={say(keys.when)} how={say(keys.how)} />
    </View>
  );
}
