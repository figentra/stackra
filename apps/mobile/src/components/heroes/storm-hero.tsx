/**
 * Stackra file contract:
 * Purpose: `StormHero`, landing hero "storm": "One system. Every brand." while the hero itself is re-themed every 3.2
 *          seconds through five of the Theme Studio's brands, a light sweeping across each change; pills pick a brand
 *          and a button pauses or plays the cycle. The preview is real HeroUI components (a chart card, a switch, a
 *          plan picker, an avatar, a field and a call to action).
 * Boundary: the re-theme is scoped: Uniwind's `ScopedVariables` gives this sub-tree the brand's own variables (the
 *           same ones the Theme Studio pushes app-wide), so classes and `useThemeColor` below it read the brand while
 *           the rest of the app keeps its theme. The variables switch at once; the sweep and the bars' regrowth carry
 *           the change. Under Reduce Motion the cycle does not run, but the pills still switch.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes, concept B "One system. Every brand.");
 *          ADR 0340 (brands over Stackra); STA-1371; WCAG 2.2 SC 2.2.2, 2.3.3.
 */
import {
  Avatar,
  Button,
  Card,
  Chip,
  haptics,
  Heading,
  Switch,
  Text,
  TextField,
  useBreakpoint,
  useCatalogueText,
  useDesignSystem,
} from "@stackra/ui/native";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ScopedVariables } from "uniwind";
import { scheduleOnRN } from "react-native-worklets";

import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { BRAND_THEMES } from "#src/constants/brand-themes.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { uniwindVariables } from "#src/stores/uniwind-variables.function";

import { GrowBar } from "./grow-bar";
import type { HeroProps } from "./hero.props";

/** The hero's keys. */
const K = BRAND_KEYS.brand.hero;

/** The brands the storm cycles through: unlike accents, corners and grounds. */
const STORM_IDS = ["stackra", "figentra", "jute", "tamo", "linear"] as const;
const STORM_BRANDS = BRAND_THEMES.filter(({ id }) => (STORM_IDS as readonly string[]).includes(id));

/** How long each brand shows, in milliseconds. */
const DWELL = 3200;

/** The revenue chart's bars, as fractions of its height. */
const BARS = [0.38, 0.52, 0.46, 0.64, 0.58, 0.72, 0.66, 0.8, 0.74, 0.88, 0.82, 0.96] as const;

/** Landing hero B: one system, re-themed brand after brand. */
export function StormHero({ onBrowse }: HeroProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { resolvedColorScheme, direction } = useDesignSystem();
  const isStill = useReducedMotion();
  const isWide = useBreakpoint().sizeClass !== "phone";
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const isCycling = isPlaying && !isStill;
  const variables = useMemo(
    () => STORM_BRANDS.map(({ theme }) => uniwindVariables(theme)[resolvedColorScheme]),
    [resolvedColorScheme],
  );
  const brand = STORM_BRANDS[index] ?? STORM_BRANDS[0];

  // The progress bar is the clock: when it fills, the next brand comes in.
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(0);
    if (!isCycling) return;
    const next = () => setIndex((was) => (was + 1) % STORM_BRANDS.length);
    progress.set(
      withTiming(1, { duration: DWELL, easing: Easing.linear }, (isDone) => {
        if (isDone) scheduleOnRN(next);
      }),
    );
    return () => cancelAnimation(progress);
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- a new brand index restarts the progress clock
  }, [index, isCycling, progress]);
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));

  // A light sweeps across the preview on each change.
  const sweep = useSharedValue(1);
  const [previewWidth, setPreviewWidth] = useState(0);
  useEffect(() => {
    if (isStill) return;
    sweep.set(0);
    sweep.set(withTiming(1, { duration: 900, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }));
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- a new brand index replays the sweep
  }, [index, isStill, sweep]);
  const band = useAnimatedStyle(() => ({
    opacity: interpolate(sweep.value, [0, 0.5, 1], [0, 0.22, 0]),
    transform: [
      { translateX: interpolate(sweep.value, [0, 1], [-previewWidth, previewWidth]) },
      { rotate: "20deg" },
    ],
  }));

  if (!brand) return null;

  const pick = (next: number) => {
    haptics.play("selection");
    setIsPlaying(false);
    setIndex(next);
  };

  const words = (
    <View className="gap-3">
      <Text type="small" tone="muted" className="uppercase tracking-widest">
        {t(K.storm.eyebrow, { name: brand.label })}
      </Text>
      <View accessible accessibilityRole="header">
        <Heading level={1} type="h1">
          {t(K.storm.title)}
        </Heading>
        <Heading level={1} type="h1" className="!text-accent-soft-foreground">
          {t(K.storm.title_accent)}
        </Heading>
      </View>
      <Text tone="muted">{t(K.storm.pitch)}</Text>
    </View>
  );

  const controls = (
    <View className="gap-4">
      <View
        className="flex-row flex-wrap gap-2"
        accessibilityRole="radiogroup"
        accessibilityLabel={t(K.storm.themes)}
      >
        {STORM_BRANDS.map(({ id, label }, at) => (
          <Button
            key={id}
            size="sm"
            variant={at === index ? "secondary" : "ghost"}
            accessibilityRole="radio"
            accessibilityState={{ checked: at === index }}
            startIcon={
              // Each dot is drawn in its own brand's accent, through that brand's variables.
              <ScopedVariables variables={variables[at] ?? {}}>
                <View className="size-3 rounded-[var(--radius-pill)] border border-border bg-accent" />
              </ScopedVariables>
            }
            onPress={() => pick(at)}
          >
            {label}
          </Button>
        ))}
      </View>
      {isCycling ? (
        <View className="h-1 w-full max-w-80 overflow-hidden rounded-[var(--radius-pill)] bg-border">
          <Animated.View
            className="h-full bg-accent"
            style={[{ transformOrigin: direction === "rtl" ? "right" : "left" }, fill]}
          />
        </View>
      ) : null}
    </View>
  );

  const actions = (
    <View className="flex-row flex-wrap gap-3">
      <Button
        onPress={() => {
          haptics.play("impact");
          onBrowse();
        }}
      >
        {t(BRAND_KEYS.brand.browse)}
      </Button>
      {isStill ? null : (
        <Button
          variant="outline"
          onPress={() => {
            haptics.play("selection");
            setIsPlaying((was) => !was);
          }}
        >
          {t(isPlaying ? K.pause : K.storm.play)}
        </Button>
      )}
    </View>
  );

  const preview = (
    <View
      className="gap-3 overflow-hidden rounded-[var(--radius-container)] border border-border bg-background p-3"
      onLayout={(event) => setPreviewWidth(event.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      <Card className="gap-3 p-4">
        <View className="flex-row items-center gap-2">
          <Text className="font-semibold">{t(K.storm.revenue)}</Text>
          <View className="ms-auto">
            <Chip size="sm" variant="primary" tone="accent">
              {t(K.storm.this_week)}
            </Chip>
          </View>
        </View>
        <Heading level={2} type="h3">
          {t(K.money, { value: 12_480 })}
        </Heading>
        <View className="h-14 flex-row items-end gap-1.5">
          {BARS.map((height, at) => (
            <GrowBar
              key={height}
              height={height}
              index={at}
              replay={index}
              isStill={isStill}
              className={`rounded-t-[var(--radius-control)] ${at === BARS.length - 1 ? "bg-accent" : "bg-accent/35"}`}
            />
          ))}
        </View>
      </Card>
      <View className="flex-row gap-3">
        <Card className="flex-1 justify-between gap-2 p-3">
          <Text type="small" tone="muted">
            {t(K.storm.notifications)}
          </Text>
          <Switch value isReadOnly />
        </Card>
        <Card className="flex-1 gap-2 p-3">
          <Text type="small" tone="muted">
            {t(K.storm.plan)}
          </Text>
          <View className="flex-row gap-1 rounded-[var(--radius-container)] border border-border p-1">
            <View className="flex-1 items-center rounded-[var(--radius-control)] bg-accent py-1.5">
              <Text type="small" className="font-semibold !text-accent-foreground">
                {t(K.storm.team)}
              </Text>
            </View>
            <View className="flex-1 items-center py-1.5">
              <Text type="small">{t(K.storm.free)}</Text>
            </View>
          </View>
        </Card>
      </View>
      {isWide ? (
        <View className="flex-row gap-3">
          <Card className="flex-1 flex-row items-center gap-3 p-3">
            <Avatar name={t(K.storm.person)} variant="soft" tone="accent" />
            <View>
              <Text className="font-semibold">{t(K.storm.person)}</Text>
              <Text type="small" tone="muted">
                {t(K.storm.person_note)}
              </Text>
            </View>
          </Card>
          <Card className="flex-1 p-3">
            <TextField label={t(K.storm.email)} value="lina@example.com" isReadOnly />
          </Card>
        </View>
      ) : null}
      <View className="flex-row items-center gap-3 rounded-[var(--radius-container)] bg-accent p-4">
        <View className="flex-1">
          <Text className="font-semibold !text-accent-foreground">{t(K.storm.deploy)}</Text>
          <Text type="small" className="!text-accent-foreground opacity-80">
            {t(K.storm.deploy_note)}
          </Text>
        </View>
        <Button size="sm" variant="secondary">
          {t(K.storm.ship)}
        </Button>
      </View>
      <Animated.View
        pointerEvents="none"
        className="absolute -inset-y-20 start-0 w-1/3 bg-accent"
        style={band}
      />
    </View>
  );

  return (
    <ScopedVariables variables={variables[index] ?? {}}>
      {isWide ? (
        <View className="flex-row items-center gap-8 px-4 pb-6">
          <View className="flex-1 gap-6">
            {words}
            {controls}
            {actions}
          </View>
          <View className="flex-1">{preview}</View>
        </View>
      ) : (
        <View className="gap-5 px-4 pb-6">
          {words}
          {controls}
          {preview}
          {actions}
        </View>
      )}
    </ScopedVariables>
  );
}
