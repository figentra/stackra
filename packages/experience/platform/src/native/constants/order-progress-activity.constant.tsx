/**
 * Stackra file contract:
 * Purpose: `ORDER_PROGRESS_ACTIVITY`, the one Live Activity layout of an order or booking in progress (Lock Screen
 *          banner, Dynamic Island compact, minimal and expanded), built with expo-widgets and Expo UI's SwiftUI views.
 * Boundary: the `'widget'` function runs in the iOS widget extension, so it reads only its props: no hooks, no
 *           imports' values, no outer constants. Its strings arrive translated. Registered under `OrderProgress`.
 * Runtime: react-native
 * Governing contract: ADR 0478 (decision 9: Expo's widget library, no hand-written Swift); STA-1539.
 */
import { HStack, Text, VStack } from "@expo/ui/swift-ui";
import { createLiveActivity } from "expo-widgets";

import type { OrderProgressProps } from "#native/types/order-progress-props.type";

/** Lays out one order or booking in progress for every Live Activity region. */
function orderProgress(props: OrderProgressProps) {
  "widget";
  const steps = `${props.step}/${props.steps}`;
  return {
    banner: (
      <VStack alignment="leading">
        <HStack>
          <Text>{props.title}</Text>
          <Text>{steps}</Text>
        </HStack>
        <Text>{props.status}</Text>
      </VStack>
    ),
    compactLeading: <Text>{steps}</Text>,
    compactTrailing: <Text>{props.status}</Text>,
    minimal: <Text>{steps}</Text>,
    expandedLeading: <Text>{props.title}</Text>,
    expandedTrailing: <Text>{steps}</Text>,
    expandedBottom: <Text>{props.status}</Text>,
  };
}

/** The order-progress Live Activity factory: `start`, then `update` and `end` on what it returns. */
export const ORDER_PROGRESS_ACTIVITY = createLiveActivity("OrderProgress", orderProgress);
