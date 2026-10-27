/**
 * Stackra file contract:
 * Purpose: one sample of a design-system review page: the component, with a small muted caption under it that names
 *          the option it shows, so the free pages caption their samples the same way.
 * Boundary: one presentational component; no state, no data and no navigation.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Text } from "@stackra/ui/native";
import { View } from "react-native";
import type { SampleProps } from "./sample.props";

/** A component with its caption underneath, aligned to the start. */
export function Sample({ caption, children }: SampleProps) {
  return (
    <View className="items-start gap-1">
      {children}
      <Text type="caption" tone="muted">
        {caption}
      </Text>
    </View>
  );
}
