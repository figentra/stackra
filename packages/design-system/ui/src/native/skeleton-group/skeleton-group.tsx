/**
 * Stackra file contract:
 * Purpose: the native `SkeletonGroup` on HeroUI Native's SkeletonGroup: maps `animationType` to `variant`, marks its
 *          subtree as a group for `Skeleton`, and names the loading region with one busy progressbar element over it
 *          while it loads.
 * Boundary: no styling of its own; the progressbar view is invisible (absolute fill, no paint, no touches). HeroUI
 *          Native hands every prop but `className` and `style` to each item, not to the group's view.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0304; WCAG 2.2 SC 4.1.3.
 */
import { SkeletonGroup as HeroSkeletonGroup } from "heroui-native";
import { StyleSheet, View } from "react-native";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SkeletonGroupContext } from "#native/skeleton-group/skeleton-group-context";
import type { SkeletonGroupProps } from "#native/skeleton-group/skeleton-group.props";

/**
 * A region of Skeletons that load together with one shared state. With a `loadingLabel` it is read as one busy
 * progress element while it loads. Props other than `className` and `style` reach every Skeleton inside, as in
 * HeroUI Native.
 */
export function SkeletonGroup({
  isLoading,
  animationType,
  loadingLabel,
  children,
  ...rest
}: SkeletonGroupProps) {
  const isNamed = loadingLabel !== undefined && isLoading !== false;
  return (
    <SkeletonGroupContext value>
      <HeroSkeletonGroup {...rest} {...omitUndefined({ isLoading, variant: animationType })}>
        {isNamed ? (
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={loadingLabel}
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {children}
      </HeroSkeletonGroup>
    </SkeletonGroupContext>
  );
}
