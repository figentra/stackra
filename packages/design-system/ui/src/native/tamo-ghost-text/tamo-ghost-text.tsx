/**
 * Stackra file contract:
 * Purpose: the native `TamoGhostText`: Tamo's suggestion drawn muted under the field, with Accept and Dismiss buttons
 *          (a touch keyboard has no Tab), read out politely when it arrives.
 * Boundary: the field stays the person's: nothing changes until Accept, which hands back the text plus the suggestion.
 * Runtime: react-native
 * Governing contract: ADR 0507 (ghost suggestion text); ADR 0021; WCAG 2.2 SC 4.1.3.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { Text } from "#native/text/text";
import type { TamoGhostTextProps } from "#native/tamo-ghost-text/tamo-ghost-text.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** Tamo's suggestion under a field. */
export function TamoGhostText({
  children,
  value,
  suggestion,
  onAccept,
  onDismiss,
  className,
}: TamoGhostTextProps): ReactElement {
  const t = useUiText();
  return (
    <View testID="tamo-ghost-text" className={["gap-2", className].filter(Boolean).join(" ")}>
      {children}
      {suggestion === "" ? null : (
        <View accessibilityLiveRegion="polite" className="gap-2">
          <Text type="small" tone="muted">
            {`…${suggestion}`}
          </Text>
          <View className="flex-row gap-2">
            <Button size="sm" variant="secondary" onPress={() => onAccept(value + suggestion)}>
              {t(K.accept)}
            </Button>
            <Button size="sm" variant="ghost" onPress={onDismiss}>
              {t(K.discard)}
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
