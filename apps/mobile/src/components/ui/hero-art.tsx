/**
 * Stackra file contract:
 * Purpose: the design-system landing's hero stage, the native twin of the web playground's `hero-art`: the beam-S
 *          wordmark at full width, echoed above and below as hairline outlines, a soft glow behind it and the brand's
 *          graph lines across it, with solid tiles of the system's parts (the st tile, a switch, the faces, a
 *          check, an avatar group) floating on them. The tiles settle in once; nothing moves after, and nothing moves
 *          under reduced motion (Reanimated's system setting). The phone set: the web's wide-screen-only tiles are
 *          left out, as the web leaves them out on a phone.
 * Boundary: decoration only: hidden from assistive technology and from touches; the page names itself in its
 *          heading. Every colour is a theme role.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); WCAG 2.2 SC 1.1.1, 2.3.3.
 */
import { Surface, useDesignSystem } from "@stackra/ui/native";
import { useThemeColor } from "heroui-native";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";

import { BrandGlyph } from "./brand-glyph";
import { StackraWordmark } from "./stackra-wordmark";

/** A tile's place on the stage (percent of its box, from the inline start), its tilt, its size and its face. */
interface Tile {
  readonly start: number;
  readonly top: number;
  readonly tilt: number;
  readonly size: number;
  readonly face: ReactNode;
}

/** The graph lines between the tiles, on a 1000 by 520 box: dashed hairlines, as the brand's graph pattern. */
const LINES = [
  "M 30 60 C 180 10, 300 340, 470 120",
  "M 470 120 C 560 40, 640 200, 700 190",
  "M 280 400 C 420 520, 520 380, 520 420",
  "M 700 190 C 820 160, 860 440, 960 300",
] as const;

/** The square nodes where the lines meet, on the same box. */
const NODES: readonly (readonly [number, number])[] = [
  [30, 60],
  [470, 120],
  [700, 190],
  [280, 400],
  [960, 300],
];

/** Glyph specimens and the brand mark: drawn shapes, not translatable text. */
const GLYPHS = { mark: "st", latin: "Aa", arabic: "أب" } as const;

const SWITCH = (
  <View className="h-[38%] w-[62%] flex-row items-center justify-end rounded-full bg-accent p-[6%]">
    <View className="aspect-square h-full rounded-full bg-accent-foreground" />
  </View>
);

const FACES = (
  <View className="flex-row items-baseline gap-1">
    <Text className="text-lg font-semibold text-foreground">{GLYPHS.latin}</Text>
    <Text className="text-base font-semibold text-foreground">{GLYPHS.arabic}</Text>
  </View>
);

const AVATARS = (
  <View className="flex-row">
    {["LH", "OS", "SK"].map((initials, index) => (
      <View
        key={initials}
        className="size-4 items-center justify-center rounded-full border border-surface bg-default"
        style={index > 0 ? { marginStart: -4 } : undefined}
      >
        <Text className="text-[6px] font-semibold text-foreground">{initials}</Text>
      </View>
    ))}
  </View>
);

/** The hero's decorative stage. */
export function HeroArt() {
  const { direction } = useDesignSystem();
  const [foreground, accentForeground, warning, muted] = useThemeColor([
    "foreground",
    "accent-foreground",
    "warning",
    "muted",
  ]);

  const tiles: readonly Tile[] = [
    {
      start: 22,
      top: 50,
      tilt: 12,
      size: 48,
      face: (
        <Text className="font-mono text-xl font-medium tracking-tighter text-foreground">
          {GLYPHS.mark}
        </Text>
      ),
    },
    { start: 41, top: 6, tilt: -6, size: 40, face: SWITCH },
    { start: 47, top: 58, tilt: 8, size: 48, face: FACES },
    {
      start: 64,
      top: 22,
      tilt: -12,
      size: 32,
      face: (
        <View className="size-[50%] items-center justify-center rounded-md bg-accent">
          <BrandGlyph name="check" color={accentForeground} size={12} />
        </View>
      ),
    },
    { start: 80, top: 60, tilt: -8, size: 40, face: AVATARS },
  ];

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="w-full py-[3%]"
    >
      <Svg
        viewBox="0 0 1000 520"
        preserveAspectRatio="none"
        style={[
          { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
          direction === "rtl" ? { transform: [{ scaleX: -1 }] } : null,
        ]}
      >
        <Defs>
          <RadialGradient id="glow-a" cx="0.3" cy="0.35" r="0.35">
            <Stop offset="0" stopColor={warning} stopOpacity={0.3} />
            <Stop offset="1" stopColor={warning} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glow-b" cx="0.72" cy="0.6" r="0.35">
            <Stop offset="0" stopColor={muted} stopOpacity={0.3} />
            <Stop offset="1" stopColor={muted} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="1000" height="520" fill="url(#glow-a)" />
        <Rect width="1000" height="520" fill="url(#glow-b)" />
        {LINES.map((d) => (
          <Path
            key={d}
            d={d}
            fill="none"
            stroke={foreground}
            strokeOpacity={0.35}
            strokeWidth={1}
            strokeDasharray="3 6"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </Svg>
      <StackraWordmark color={foreground} variant="outline" opacity={0.25} />
      <View style={{ marginTop: "-7%" }}>
        <StackraWordmark color={foreground} />
      </View>
      <View style={{ marginTop: "-7%" }}>
        <StackraWordmark color={foreground} variant="outline" opacity={0.25} />
      </View>
      {NODES.map(([x, y]) => (
        <View
          key={`${x}-${y}`}
          className="absolute size-1.5 bg-foreground/50"
          style={{ start: `${x / 10}%`, top: `${(y / 520) * 100}%`, margin: -3 }}
        />
      ))}
      {tiles.map(({ start, top, tilt, size, face }, index) => (
        <Animated.View
          key={`${start}-${top}`}
          entering={FadeInDown.delay(120 + index * 70).duration(600)}
          style={{ position: "absolute", start: `${start}%`, top: `${top}%` }}
        >
          <Surface
            className="items-center justify-center p-0"
            style={{
              width: size,
              height: size,
              borderRadius: size * 0.22,
              transform: [{ rotate: `${tilt}deg` }],
            }}
          >
            {face}
          </Surface>
        </Animated.View>
      ))}
    </View>
  );
}
