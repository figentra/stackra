/**
 * Stackra file contract:
 * Purpose: the native `Thumbnail`: a resource's image (a product, a menu item, a file) in a fixed-width box of the
 *          given aspect ratio with the theme's large radius. A blurred `placeholderSrc` (React Native's `blurRadius`)
 *          shows while `src` loads, then the image fades in over it with Reanimated; with no image, or a broken one,
 *          an image icon shows on the default fill.
 * Boundary: reduced motion shows the image at once. Decorative unless `alt` names it as one image. Uses React Native's
 *           Image, so no new dependency; colours and radius are tokens.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; design-system gap inventory row 12; WCAG 2.2 SC 1.1.1.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { cn } from "heroui-native";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import { THUMBNAIL_RADIUS_CLASS_NAME } from "#core/constants/thumbnail-radius-class-name.constant";
import { THUMBNAIL_WIDTHS } from "#core/constants/thumbnail-widths.constant";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import type { ThumbnailProps } from "#native/thumbnail/thumbnail.props";

const BASE = motionTiming(STACKRA_THEME, "base");

/** How strongly the placeholder is blurred, in points. */
const PLACEHOLDER_BLUR = 8;

/** The props of a decorative thumbnail: hidden from VoiceOver and TalkBack alike. */
const HIDDEN = Object.freeze({
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const);

/** A square (or `aspectRatio`) image of a resource, with a blur-up placeholder and an icon fallback. */
export function Thumbnail({
  src,
  placeholderSrc,
  alt,
  size = "md",
  aspectRatio = 1,
  fit = "cover",
  fallback,
  className,
  style,
  ...rest
}: ThumbnailProps): ReactElement {
  const isReduced = useReducedMotion();
  // The src that failed, so a new src is tried again without an effect.
  const [brokenSrc, setBrokenSrc] = useState<string | undefined>(undefined);
  const opacity = useSharedValue(0);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  const showsFallback = !src || brokenSrc === src;
  const accessibility = alt
    ? { accessible: true, accessibilityRole: "image" as const, accessibilityLabel: alt }
    : HIDDEN;

  return (
    <View
      {...rest}
      {...accessibility}
      className={
        cn(
          "items-center justify-center overflow-hidden bg-default",
          THUMBNAIL_RADIUS_CLASS_NAME,
          className,
        ) ?? ""
      }
      style={[{ width: THUMBNAIL_WIDTHS[size], aspectRatio }, style]}
    >
      {showsFallback ? (
        <SlotIcon icon={fallback ?? (src ? "image-off" : "image")} />
      ) : (
        <>
          {placeholderSrc ? (
            <Image
              source={{ uri: placeholderSrc }}
              blurRadius={PLACEHOLDER_BLUR}
              resizeMode={fit}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <Animated.Image
            source={{ uri: src }}
            resizeMode={fit}
            style={[StyleSheet.absoluteFill, fade]}
            // Each load, of this src or a new one, starts hidden.
            onLoadStart={() => opacity.set(0)}
            onLoad={() => opacity.set(isReduced ? 1 : withTiming(1, { duration: BASE.durationMs }))}
            onError={() => setBrokenSrc(src)}
          />
        </>
      )}
    </View>
  );
}
