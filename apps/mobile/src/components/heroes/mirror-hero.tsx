/**
 * Stackra file contract:
 * Purpose: `MirrorHero`, landing hero "mirror": the same hero in English and in Arabic, flipping every 4.2 seconds with
 *          a 3D turn. The Arabic side mirrors the layout (an orders card of real HeroUI components), its numbers and
 *          its type; an EN | عربي switch picks a side and a button pauses the flip; a bilingual ticker runs beneath.
 * Boundary: the direction is the hero's own sub-tree (`Bidi` as a block sets Yoga's direction and `useDirection`
 *           below it), never `I18nManager`, so the app around it keeps its language. Each side's words come from its
 *           own catalogue (`MESSAGES.en` or `MESSAGES.ar`), whatever the app's language. Under Reduce Motion the flip
 *           does not run and a side switches without the turn.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes, concept C "Mirror"); ADR 0060 (RTL);
 *          STA-1371; WCAG 2.2 SC 2.2.2, 2.3.3, 3.1.2.
 */
import { CATEGORIES, categoryKeys } from "@stackra/showcase";
import { formatMessage, intlLocale, NumberingSystem, type I18nKey } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import {
  Avatar,
  Bidi,
  Button,
  Card,
  Chip,
  haptics,
  Heading,
  IconButton,
  Text,
  useBreakpoint,
  useCatalogueText,
} from "@stackra/ui/native";
import { motionEasing, motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useReducedMotion,
  withTiming,
  type EntryAnimationsValues,
} from "react-native-reanimated";

import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";

import { HeroTicker } from "./hero-ticker";
import type { HeroProps } from "./hero.props";

/** The hero's keys. */
const K = BRAND_KEYS.brand.hero;

/** The side switch's labels: each language named in itself, the same in every locale. */
const SIDES = { en: "EN", ar: "عربي" } as const;

/** How long each side shows, in milliseconds. */
const DWELL = 4200;

/** The theme's motion the hero plays: the card's turn (`blink`), the words' rise (`count`) and their `enter` easing. */
const TURN_MS = motionTiming(STACKRA_THEME, "blink").durationMs;
const RISE_MS = motionTiming(STACKRA_THEME, "count").durationMs;
const ENTER = motionEasing(STACKRA_THEME, "enter");

/** The orders: who, which SKU, the status and the amount. */
const ORDERS = [
  { person: K.mirror.person_1, sku: "SKU-104-B", status: "paid", tone: "success", amount: 248 },
  { person: K.mirror.person_2, sku: "SKU-221-A", status: "pending", tone: "warning", amount: 92.5 },
  { person: K.mirror.person_3, sku: "SKU-087-C", status: "shipped", tone: "default", amount: 1310 },
] as const;

/** A side's words, from its own catalogue, in the digits set for the app (`numerals`). */
const sideText =
  (lang: "en" | "ar", numerals: NumberingSystem = NumberingSystem.User) =>
  (key: I18nKey, values?: Record<string, unknown>) =>
    formatMessage(MESSAGES[lang], key, values, intlLocale(lang, numerals), numerals);

/** The card turning in: from 70° on the side it comes from, as the mockup's `rotateY(±70deg) scale(.94)`. */
const turnIn = (from: number) => (values: EntryAnimationsValues) => {
  "worklet";
  const timing = { duration: TURN_MS, easing: Easing.bezier(...ENTER) };
  void values;
  return {
    initialValues: {
      opacity: 0,
      transform: [{ perspective: 1400 }, { rotateY: `${from}deg` }, { scale: 0.94 }],
    },
    animations: {
      opacity: withTiming(1, timing),
      transform: [
        { perspective: 1400 },
        { rotateY: withTiming("0deg", timing) },
        { scale: withTiming(1, timing) },
      ],
    },
  };
};
const TURN_FROM_LEFT = turnIn(-70);
const TURN_FROM_RIGHT = turnIn(70);

/** Landing hero C: English and Arabic, one mirrored into the other. */
export function MirrorHero({ onBrowse, onTheme }: HeroProps) {
  const t = useCatalogueText(MESSAGES.en);
  const isStill = useReducedMotion();
  const isWide = useBreakpoint().sizeClass !== "phone";
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [isPlaying, setIsPlaying] = useState(true);
  const isFlipping = isPlaying && !isStill;
  const isRtl = lang === "ar";
  // Both sides write the digits the app is set to (the customer's setting, Latin by default; ADR 0192).
  const s = sideText(lang, useNumerals());

  useEffect(() => {
    if (!isFlipping) return;
    const timer = setTimeout(() => setLang((was) => (was === "en" ? "ar" : "en")), DWELL);
    return () => clearTimeout(timer);
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- each flip of the side starts the next dwell timer
  }, [isFlipping, lang]);

  const show = (next: "en" | "ar") => {
    haptics.play("selection");
    setIsPlaying(false);
    setLang(next);
  };
  // Spread, not passed as `entering={undefined}`, which Reanimated's types refuse under exactOptionalPropertyTypes.
  const rise = (delay: number) =>
    isStill ? {} : { entering: FadeInDown.duration(RISE_MS).delay(delay) };
  const ticker = CATEGORIES.slice(0, 8).flatMap(({ id }) => {
    const key = categoryKeys(id).title as I18nKey;
    return [
      { text: sideText("en")(key), lang: "en" as const },
      { text: sideText("ar")(key), lang: "ar" as const },
    ];
  });

  const words = (
    <View className="gap-4">
      <Animated.View {...rise(0)}>
        <Text
          type="small"
          lang={lang}
          className={
            isRtl
              ? "!text-accent-soft-foreground"
              : "uppercase tracking-widest !text-accent-soft-foreground"
          }
        >
          {s(K.mirror.eyebrow)}
        </Text>
      </Animated.View>
      <Animated.View {...rise(100)} accessible accessibilityRole="header">
        <Heading level={1} type="h1" lang={lang}>
          {s(K.mirror.title)}
        </Heading>
        <Heading level={1} type="h1" lang={lang} className="!text-accent-soft-foreground">
          {s(K.mirror.title_accent)}
        </Heading>
      </Animated.View>
      <Animated.View {...rise(200)} className="gap-4">
        <Text tone="muted" lang={lang}>
          {s(K.mirror.pitch)}
        </Text>
        <View className="flex-row flex-wrap gap-3">
          <Button
            onPress={() => {
              haptics.play("impact");
              onBrowse();
            }}
          >
            {s(BRAND_KEYS.brand.browse)}
          </Button>
          <Button
            variant="outline"
            onPress={() => {
              haptics.play("impact");
              onTheme();
            }}
          >
            {s(K.mirror.studio)}
          </Button>
        </View>
      </Animated.View>
    </View>
  );

  const card = (
    <Animated.View
      {...(isStill ? {} : { entering: isRtl ? TURN_FROM_RIGHT : TURN_FROM_LEFT })}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      <Card className="gap-3 p-4 shadow-overlay">
        <View className="flex-row items-center gap-2">
          <Heading level={2} type="h4" lang={lang}>
            {s(K.mirror.orders)}
          </Heading>
          <View className="ms-auto">
            <Button size="sm">{s(K.mirror.new_order)}</Button>
          </View>
        </View>
        <View className="h-10 justify-center rounded-[var(--radius-container)] border border-border bg-field px-3">
          <Text type="small" tone="muted" lang={lang}>
            {s(K.mirror.search)}
          </Text>
        </View>
        {ORDERS.map(({ person, sku, status, tone, amount }) => (
          <View key={sku} className="flex-row items-center gap-3 border-t border-separator pt-3">
            <Avatar name={s(person)} size="sm" />
            <View className="flex-1">
              <Text type="small" lang={lang} className="font-medium" isTruncated>
                {s(person)}
              </Text>
              <Text type="caption" tone="muted" lang={lang} isTruncated>
                {s(K.mirror.order, { sku })}
              </Text>
            </View>
            <Chip size="sm" variant="soft" tone={tone}>
              {s(K.status[status])}
            </Chip>
            <Text type="small" lang={lang} className="min-w-16 text-end font-medium">
              {s(K.money, { value: amount })}
            </Text>
          </View>
        ))}
      </Card>
    </Animated.View>
  );

  return (
    <View className="gap-5 pb-6">
      <View className="flex-row items-center gap-2 px-4">
        <View
          className="flex-row gap-1 rounded-[var(--radius-container)] border border-border bg-surface p-1"
          accessibilityRole="radiogroup"
          accessibilityLabel={t(K.mirror.direction)}
        >
          <Button
            size="sm"
            variant={isRtl ? "ghost" : "primary"}
            accessibilityRole="radio"
            accessibilityState={{ checked: !isRtl }}
            accessibilityLanguage="en"
            onPress={() => show("en")}
          >
            {SIDES.en}
          </Button>
          <Button
            size="sm"
            variant={isRtl ? "primary" : "ghost"}
            accessibilityRole="radio"
            accessibilityState={{ checked: isRtl }}
            accessibilityLanguage="ar"
            onPress={() => show("ar")}
          >
            {SIDES.ar}
          </Button>
        </View>
        {isStill ? null : (
          <IconButton
            variant="ghost"
            icon={isPlaying ? Icons.Pause : Icons.Play}
            label={t(isPlaying ? K.mirror.pause : K.mirror.play)}
            onPress={() => setIsPlaying((was) => !was)}
          />
        )}
      </View>
      <Bidi isBlock dir={isRtl ? "rtl" : "ltr"}>
        {/* Keyed by side, so each flip mounts the side afresh and its entrances run again. */}
        <View
          key={lang}
          className={`gap-6 px-4 ${isWide ? "flex-row items-center" : ""}`}
          accessibilityLanguage={lang}
        >
          <View className={isWide ? "flex-1" : ""}>{words}</View>
          <View className={isWide ? "flex-1" : ""}>{card}</View>
        </View>
      </Bidi>
      <HeroTicker words={ticker} isStill={!isFlipping} />
    </View>
  );
}
