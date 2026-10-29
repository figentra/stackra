/**
 * Stackra file contract:
 * Purpose: `GLANCE_WIDGET`, the one widget layout of the app (`Glance`): a title, a value and a caption on the home
 *          screen, the value and title on the Lock Screen, and one line inline, built with expo-widgets and Expo UI's
 *          SwiftUI views.
 * Boundary: the `'widget'` function runs in the iOS widget extension, so it reads only its props and environment: no
 *           hooks, no imports' values, no outer constants. Its strings arrive translated. Registered under `Glance`,
 *           which the app config's expo-widgets entry names with its families.
 * Runtime: react-native
 * Governing contract: ADR 0478 (decision 9: Expo's widget library, no hand-written Swift); STA-1539.
 */
import { Text, VStack } from "@expo/ui/swift-ui";
import { createWidget } from "expo-widgets";
import type { WidgetEnvironment } from "expo-widgets";

import type { WidgetGlance } from "#contracts/types/widget-glance.type";

/** Lays out one glance for the widget family the system asks for. */
function glance(props: WidgetGlance, environment: WidgetEnvironment) {
  "widget";
  if (environment.widgetFamily === "accessoryInline")
    return <Text>{`${props.title} ${props.value}`}</Text>;
  return (
    <VStack alignment="leading">
      <Text>{props.title}</Text>
      <Text>{props.value}</Text>
      {props.caption && environment.widgetFamily.startsWith("system") ? (
        <Text>{props.caption}</Text>
      ) : null}
    </VStack>
  );
}

/** The glance widget: `updateSnapshot` writes its props into the app group the widget reads. */
export const GLANCE_WIDGET = createWidget("Glance", glance);
