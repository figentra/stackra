/**
 * Stackra file contract:
 * Purpose: the native `AccountConnection`: a `Card` row with the service's logo, name and description, a `StatusBadge`
 *          (success "connected" with the account's name, or neutral "not connected") and one `Button` to connect or
 *          disconnect, with an optional terms footnote. When the state changes, the status fades over (Reanimated at
 *          the theme's `fast` step, following the system's reduce-motion setting) and is announced; connecting plays
 *          the success haptic.
 * Boundary: builds on `#native/card/card`, `#native/status-badge/status-badge`, `#native/button/button` and
 *           `#native/text/text`; the connecting itself is the app's. The logo is hidden from VoiceOver and TalkBack.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); design-system gap inventory row 38.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut, ReduceMotion } from "react-native-reanimated";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Button } from "#native/button/button";
import { Card } from "#native/card/card";
import { haptics } from "#native/haptics/haptics";
import { StatusBadge } from "#native/status-badge/status-badge";
import { Text } from "#native/text/text";
import type { AccountConnectionProps } from "#native/account-connection/account-connection.props";

const FAST = motionTiming(STACKRA_THEME, "fast").durationMs;
const ENTERING = FadeIn.duration(FAST).reduceMotion(ReduceMotion.System);
const EXITING = FadeOut.duration(FAST).reduceMotion(ReduceMotion.System);

/** An external service the store can connect an account to, with its state and the one action that changes it. */
export function AccountConnection({
  title,
  description,
  logo,
  isConnected,
  accountName,
  connectedLabel,
  disconnectedLabel,
  connectLabel,
  disconnectLabel,
  isLoading,
  details,
  onConnect,
  onDisconnect,
  ...rest
}: AccountConnectionProps): ReactElement {
  const wasConnected = useRef(isConnected);
  useEffect(() => {
    if (isConnected && !wasConnected.current) haptics.play("success");
    wasConnected.current = isConnected;
  }, [isConnected]);

  return (
    <Card {...rest}>
      <View className="flex-row flex-wrap items-center gap-4">
        {logo === undefined ? null : (
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {logo}
          </View>
        )}
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-medium">{title}</Text>
          {description === undefined ? null : (
            <Text type="small" tone="muted">
              {description}
            </Text>
          )}
          <View accessibilityLiveRegion="polite">
            <Animated.View
              key={isConnected ? "on" : "off"}
              entering={ENTERING}
              exiting={EXITING}
              className="flex-row flex-wrap items-center gap-2"
            >
              <StatusBadge tone={isConnected ? "success" : "default"} size="sm">
                {isConnected ? connectedLabel : disconnectedLabel}
              </StatusBadge>
              {isConnected && accountName ? (
                <Text type="small" tone="muted" isTruncated>
                  {accountName}
                </Text>
              ) : null}
            </Animated.View>
          </View>
        </View>
        <Button
          variant={isConnected ? "secondary" : "primary"}
          {...omitUndefined({ isLoading, onPress: isConnected ? onDisconnect : onConnect })}
        >
          {isConnected ? disconnectLabel : connectLabel}
        </Button>
      </View>
      {details === undefined ? null : (
        <Text type="caption" tone="muted" className="mt-3">
          {details}
        </Text>
      )}
    </Card>
  );
}
