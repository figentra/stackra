/**
 * Stackra file contract:
 * Purpose: the native `DocHero`, the header of the mobile component screen and of a category page: chips (status,
 *          platform), the benefit-led headline, a short paragraph, tags and "Suggest an improvement" (opens the issue
 *          form in the system browser). It fades up once; reduced motion shows it in place. The live signature demo is
 *          the Preview tab right under it.
 * Boundary: presentation; every word comes in translated.
 * Runtime: react-native
 * Governing contract: STA-1371 (doc pages wave, owner approval 2026-10-28).
 */
import { suggestUrl } from "@stackra/showcase";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { Chip, Link, Text, useCatalogueText, useHaptic } from "@stackra/ui/native";
import { View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";

import type { DocHeroProps } from "#src/components/doc-screen/doc-hero.props";
import { DOC_KEYS } from "#src/components/doc-screen/doc-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

const K = DOC_KEYS.showcase.doc.ui;

/** The hero's rise: the theme's `slow` step. */
const SLOW = motionTiming(STACKRA_THEME, "slow");

/** The top of a doc screen: chips, headline, intro and tags. */
export function DocHero({ chips, headline, intro, tags, page, introLines }: DocHeroProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { play } = useHaptic();
  const isReducedMotion = useReducedMotion();
  const tagList = tags
    .split("·")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return (
    <Animated.View
      {...(isReducedMotion ? {} : { entering: FadeInDown.duration(SLOW.durationMs) })}
      className="gap-2"
    >
      {chips ? <View className="flex-row flex-wrap items-center gap-2">{chips}</View> : null}
      <Text className="text-lg font-semibold">{headline}</Text>
      <Text type="small" tone="muted" numberOfLines={introLines}>
        {intro}
      </Text>
      <View className="flex-row flex-wrap items-center gap-2">
        {tagList.map((tag) => (
          <Chip key={tag} size="sm" variant="soft">
            {tag}
          </Chip>
        ))}
      </View>
      <Link href={suggestUrl(page)} isExternal underline="hover" onPress={() => play("selection")}>
        {t(K.suggest)}
      </Link>
    </Animated.View>
  );
}
