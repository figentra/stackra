/**
 * Stackra file contract:
 * Purpose: the native `TamoMarker`: the AI-made marker, Tamo's mark and "Made with Tamo" on content Tamo made, or a
 *          warning-toned "Filled by Tamo, check it" on a field Tamo filled that the person has not checked.
 * Boundary: a label only; whether content is Tamo's is the caller's record (ADR 0360 decision 11).
 * Runtime: react-native
 * Governing contract: ADR 0507; ADR 0360 (decision 11); WCAG 2.2 SC 1.4.1 (the words, not the colour).
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { TamoMark } from "#native/tamo-mark/tamo-mark";
import { Text } from "#native/text/text";
import type { TamoMarkerProps } from "#native/tamo-marker/tamo-marker.props";

/** The AI-made marker. */
export function TamoMarker({
  needsReview = false,
  label,
  className,
}: TamoMarkerProps): ReactElement {
  const t = useUiText();
  return (
    <View
      testID="tamo-marker"
      className={[
        "flex-row items-center gap-1 self-start rounded-[var(--radius-pill)] px-2 py-0.5",
        needsReview ? "bg-warning-soft" : "bg-default",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <TamoMark size="sm" />
      <Text
        type="caption"
        {...(needsReview ? { tone: "warning" as const } : { className: "text-tamo-name" })}
      >
        {label ?? t(needsReview ? TAMO_KEYS.ui.tamo.review : TAMO_KEYS.ui.tamo.made)}
      </Text>
    </View>
  );
}
