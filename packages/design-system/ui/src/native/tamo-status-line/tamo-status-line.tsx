/**
 * Stackra file contract:
 * Purpose: the native `TamoStatusLine`: the one state line of every Tamo part: working (the shimmer words and Stop),
 *          error (the message and Try again); nothing while idle or ready.
 * Boundary: a polite live region, so the change is read without moving focus.
 * Runtime: react-native
 * Governing contract: ADR 0507 (one working, stop, retry and error set); WCAG 2.2 SC 4.1.3.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { Shimmer } from "#native/shimmer/shimmer";
import { TamoMark } from "#native/tamo-mark/tamo-mark";
import { Text } from "#native/text/text";
import type { TamoStatusLineProps } from "#native/tamo-status-line/tamo-status-line.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** Tamo's working and error line. */
export function TamoStatusLine({
  status,
  onStop,
  onRetry,
  errorMessage,
  workingLabel,
  className,
}: TamoStatusLineProps): ReactElement {
  const t = useUiText();
  return (
    <View
      testID="tamo-status"
      accessibilityLiveRegion="polite"
      className={["min-h-8 flex-row flex-wrap items-center gap-2", className]
        .filter(Boolean)
        .join(" ")}
    >
      {status === "working" ? (
        <>
          <TamoMark size="sm" status="working" />
          <Shimmer>{workingLabel ?? t(K.working)}</Shimmer>
          {onStop ? (
            <Button size="sm" variant="ghost" startIcon="square" onPress={onStop}>
              {t(K.stop)}
            </Button>
          ) : null}
        </>
      ) : null}
      {status === "error" ? (
        <>
          <TamoMark size="sm" status="error" />
          <Text type="small" tone="danger">
            {errorMessage ?? t(K.error)}
          </Text>
          {onRetry ? (
            <Button size="sm" variant="secondary" startIcon="rotate-ccw" onPress={onRetry}>
              {t(K.retry)}
            </Button>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
