/**
 * Stackra file contract:
 * Purpose: the native `PullToRefresh`: a ScrollView with the platform's own RefreshControl, tinted with the theme's
 *          accent (iOS spinner, Android progress circle), showing while the `onRefresh` promise runs or while the app
 *          says `isRefreshing`, and playing the light haptic when a pull starts a reload.
 * Boundary: the platform draws and animates the spinner, so reduced motion and screen readers are the system's. Other
 *           ScrollView props pass through; `refreshControl` is the component's. A rejected `onRefresh` still ends the
 *           spinner, and the rejection is left to the app.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28).
 */
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import type { ReactElement } from "react";

import { haptics } from "#native/haptics/haptics";
import type { PullToRefreshProps } from "#native/pull-to-refresh/pull-to-refresh.props";

/** A scrolling area that reloads when pulled down from the top. */
export function PullToRefresh({
  children,
  onRefresh,
  isRefreshing,
  label,
  ...rest
}: PullToRefreshProps): ReactElement {
  const [ownRefreshing, setOwnRefreshing] = useState(false);
  const accent = useThemeColor("accent");
  const refresh = async () => {
    haptics.play("light");
    setOwnRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setOwnRefreshing(false);
    }
  };

  return (
    <ScrollView
      {...rest}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing ?? ownRefreshing}
          onRefresh={() => void refresh()}
          tintColor={accent}
          colors={[accent]}
          {...(label === undefined ? {} : { title: label, accessibilityLabel: label })}
        />
      }
    >
      {children}
    </ScrollView>
  );
}
