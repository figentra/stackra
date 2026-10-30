/**
 * Stackra file contract:
 * Purpose: `StackHero`, landing hero "stack": "Tokens. / Components. / Products." beside three real layers floating in
 *          3D (the theme's swatches and type, live HeroUI controls, a product card with a scanning light and growing
 *          bars), and a button that assembles the stack into the product card or explodes it again.
 * Boundary: the stage is decoration, hidden from assistive technology and touches; the words and buttons are the
 *           hero. Every colour is a theme role. Motion is Reanimated on the UI thread; under Reduce Motion nothing
 *           loops and the assemble button switches at once.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes, concept A "The Stack"); STA-1371; WCAG 2.2
 *          SC 1.1.1, 2.3.3.
 */
import {
  Button,
  Card,
  Chip,
  haptics,
  Heading,
  Switch,
  Text,
  useBreakpoint,
  useCatalogueText,
} from "@stackra/ui/native";
import { useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

import { GrowBar } from "./grow-bar";
import type { HeroProps } from "./hero.props";

/** The hero's keys. */
const K = BRAND_KEYS.brand.hero;

/** The type layer's glyph samples: a Latin and an Arabic pair, shown as letterforms, not copy. */
const GLYPHS = { en: "Aa", ar: "أب" } as const;

/** The heroes' ease-out (CSS `cubic-bezier(.2,.8,.2,1)`). */
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

/** The product card's bars, as fractions of the chart's height. */
const BARS = [0.42, 0.64, 0.5, 0.78, 0.58, 0.88, 0.7, 0.96, 0.74, 1] as const;

/** The token layer's swatches: theme roles, never literal colours. */
const SWATCHES = ["bg-accent", "bg-accent-soft", "bg-foreground", "bg-default"] as const;

/** The token layer's corner samples. */
const CORNERS = ["rounded-sm", "rounded-lg", "rounded-full"] as const;

/** A layer's float: how far it drifts up (points, at full size) in the 6-second breath. */
const DRIFT = [-7, 6, 13] as const;

/** One layer of the stack, placed and turned by the stage's two clocks. */
function Layer({
  index,
  size,
  assembled,
  float,
  children,
}: {
  index: 0 | 1 | 2;
  size: { width: number; height: number; spread: number };
  assembled: SharedValue<number>;
  float: SharedValue<number>;
  children: ReactNode;
}) {
  const place = useAnimatedStyle(() => {
    const open = 1 - assembled.value;
    const lift =
      ((index - 1) * size.spread + DRIFT[index] * (size.width / 360) * float.value) * open;
    return {
      // The two lower layers fade into the product as the stack closes.
      opacity: index === 2 ? 1 : interpolate(assembled.value, [0, 0.6], [1, 0], "clamp"),
      transform: [
        { perspective: 1800 },
        { translateY: -lift },
        { rotateX: `${56 * open}deg` },
        { rotateZ: `${-36 * open}deg` },
      ],
    };
  });
  return (
    <Animated.View className="absolute" style={[{ width: size.width, height: size.height }, place]}>
      {children}
    </Animated.View>
  );
}

/** The scanning light across the product card. */
function Scan({ width, isStill }: { width: number; isStill: boolean }) {
  const sweep = useSharedValue(0);
  useEffect(() => {
    if (isStill) return;
    sweep.set(withRepeat(withTiming(1, { duration: 4500, easing: Easing.linear }), -1));
    return () => cancelAnimation(sweep);
  }, [isStill, sweep]);
  const band = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(sweep.value, [0, 1], [-width, width * 1.2]) },
      { rotate: "20deg" },
    ],
  }));
  if (isStill) return null;
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute -inset-y-10 w-1/3 bg-foreground/10"
      style={band}
    />
  );
}

/** The live dot beside "Orders today". */
function Blink({ isStill }: { isStill: boolean }) {
  const glow = useSharedValue(1);
  useEffect(() => {
    if (isStill) return;
    glow.set(withRepeat(withTiming(0.25, { duration: 800 }), -1, true));
    return () => cancelAnimation(glow);
  }, [glow, isStill]);
  const fade = useAnimatedStyle(() => ({ opacity: glow.value }));
  return <Animated.View className="size-2 rounded-full bg-success" style={fade} />;
}

/** Landing hero A: the three layers of the system. */
export function StackHero({ onBrowse }: HeroProps) {
  const t = useCatalogueText(MESSAGES.en);
  const isStill = useReducedMotion();
  const isWide = useBreakpoint().sizeClass !== "phone";
  const [isAssembled, setIsAssembled] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const assembled = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    assembled.set(
      isStill
        ? Number(isAssembled)
        : withTiming(Number(isAssembled), { duration: 1200, easing: EASE }),
    );
  }, [assembled, isAssembled, isStill]);
  useEffect(() => {
    if (isStill) return;
    float.set(
      withRepeat(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    return () => cancelAnimation(float);
  }, [float, isStill]);

  // The layer's footprint once turned is about 1.2 times its width, so it is sized to fill the stage.
  const width = Math.min(stageWidth / 1.22, 400);
  const size = { width, height: width * 0.68, spread: width * 0.3 };
  const stageHeight = width * 1.3;
  const lines = [K.stack.tokens, K.stack.components, K.stack.products] as const;
  const stats = [
    { label: K.stack.orders, value: t(K.count, { value: 128 }) },
    { label: K.stack.revenue, value: t(K.money_whole, { value: 5440 }) },
    { label: K.stack.returns, value: t(K.count, { value: 3 }) },
  ] as const;

  return (
    <View className={`gap-6 px-4 pb-6 ${isWide ? "flex-row-reverse items-center" : ""}`}>
      <View
        className={isWide ? "flex-1" : ""}
        style={{ height: stageHeight || undefined }}
        onLayout={(event) => setStageWidth(event.nativeEvent.layout.width)}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {width > 0 ? (
          <View className="flex-1 items-center justify-center">
            <Layer index={0} size={size} assembled={assembled} float={float}>
              <Card variant="secondary" className="flex-1 gap-3 p-4">
                <Text type="small" tone="muted" className="font-semibold uppercase tracking-wider">
                  {t(K.stack.layer_tokens)}
                </Text>
                <View className="flex-row gap-2">
                  {SWATCHES.map((swatch) => (
                    <View key={swatch} className={`h-10 flex-1 rounded-xl ${swatch}`} />
                  ))}
                </View>
                <View className="flex-row items-center justify-between">
                  <Heading level={3} type="h2" lang="en">
                    {GLYPHS.en}
                  </Heading>
                  <Heading level={3} type="h2" lang="ar">
                    {GLYPHS.ar}
                  </Heading>
                </View>
                <View className="flex-row gap-2">
                  {CORNERS.map((corner) => (
                    <View key={corner} className={`size-6 border border-accent ${corner}`} />
                  ))}
                </View>
              </Card>
            </Layer>
            <Layer index={1} size={size} assembled={assembled} float={float}>
              <Card className="flex-1 gap-3 p-4">
                <Text type="small" tone="muted" className="font-semibold uppercase tracking-wider">
                  {t(K.stack.layer_components)}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Button size="sm">{t(K.stack.publish)}</Button>
                  <Button size="sm" variant="outline">
                    {t(K.stack.preview)}
                  </Button>
                  <View className="ms-auto">
                    <Switch value isReadOnly />
                  </View>
                </View>
                <View className="h-10 justify-center rounded-xl border border-border bg-field px-3">
                  <Text type="small" tone="muted">
                    {t(K.stack.search)}
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  <Chip size="sm" variant="soft" tone="success">
                    {t(K.status.paid)}
                  </Chip>
                  <Chip size="sm" variant="soft" tone="warning">
                    {t(K.status.pending)}
                  </Chip>
                  <Chip size="sm" variant="soft">
                    {t(K.status.shipped)}
                  </Chip>
                </View>
              </Card>
            </Layer>
            <Layer index={2} size={size} assembled={assembled} float={float}>
              <Card className="flex-1 gap-3 overflow-hidden p-4 shadow-xl">
                <Scan width={size.width} isStill={isStill} />
                <View className="flex-row items-center gap-2">
                  <Blink isStill={isStill} />
                  <Text type="small" className="font-semibold">
                    {t(K.stack.orders_today)}
                  </Text>
                  <Text
                    type="small"
                    tone="muted"
                    className="ms-auto font-semibold uppercase tracking-wider"
                  >
                    {t(K.stack.layer_product)}
                  </Text>
                </View>
                <View className="h-12 flex-row items-end gap-1.5">
                  {BARS.map((height, index) => (
                    <GrowBar
                      key={height}
                      height={height}
                      index={index}
                      isStill={isStill}
                      className="rounded-t-md bg-accent"
                    />
                  ))}
                </View>
                <View className="flex-row gap-2">
                  {stats.map(({ label, value }) => (
                    <View key={label} className="flex-1 rounded-xl bg-default/60 px-2 py-1">
                      <Text type="small" tone="muted" numberOfLines={1} adjustsFontSizeToFit>
                        {t(label)}
                      </Text>
                      <Text className="font-semibold" numberOfLines={1} adjustsFontSizeToFit>
                        {value}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            </Layer>
          </View>
        ) : null}
      </View>
      <View className={`gap-4 ${isWide ? "flex-1" : ""}`}>
        <Animated.View entering={FadeInDown.duration(900)}>
          <Text type="small" className="uppercase tracking-widest !text-accent-soft-foreground">
            {t(K.stack.eyebrow)}
          </Text>
        </Animated.View>
        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel={lines.map((line) => t(line)).join(" ")}
        >
          {lines.map((line, index) => (
            <Animated.View key={line} entering={FadeInDown.duration(900).delay(120 * (index + 1))}>
              <Heading
                level={1}
                type="h1"
                className={index === 2 ? "!text-accent-soft-foreground" : ""}
              >
                {t(line)}
              </Heading>
            </Animated.View>
          ))}
        </View>
        <Animated.View entering={FadeInDown.duration(900).delay(360)} className="gap-4">
          <Text tone="muted">{t(K.stack.pitch)}</Text>
          <View className="flex-row flex-wrap gap-3">
            <Button
              onPress={() => {
                haptics.play("impact");
                onBrowse();
              }}
            >
              {t(BRAND_KEYS.brand.browse)}
            </Button>
            <Button
              variant="outline"
              onPress={() => {
                haptics.play("selection");
                setIsAssembled((was) => !was);
              }}
            >
              {t(isAssembled ? K.stack.explode : K.stack.assemble)}
            </Button>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
