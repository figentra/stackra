/**
 * Stackra file contract:
 * Purpose: the native `LoadingOverlay`: a region whose content is covered by a translucent layer with a spinner and a
 *          message while `isLoading`, catching every touch and hiding the content from screen readers.
 * Boundary: the message is a polite live region; the layer appears without motion. The content keeps its layout.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.3; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { LoadingOverlayProps } from "#native/loading-overlay/loading-overlay.props";
import { Spinner } from "#native/spinner/spinner";
import { Text } from "#native/text/text";

/** Covers a region while it loads. */
export function LoadingOverlay({
  children,
  isLoading,
  message,
  className,
}: LoadingOverlayProps): ReactElement {
  const t = useUiText();
  return (
    <View className={`relative ${className ?? ""}`}>
      <View
        importantForAccessibility={isLoading ? "no-hide-descendants" : "auto"}
        accessibilityElementsHidden={isLoading}
      >
        {children}
      </View>
      {isLoading ? (
        <View className="absolute inset-0 z-10 items-center justify-center gap-2 bg-background/75 p-4">
          <Spinner />
          <Text className="font-medium" accessibilityLiveRegion="polite">
            {message ?? t(DISPLAY_KEYS.ui.loading_overlay.loading)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
