/**
 * Stackra file contract:
 * Purpose: the Settings tab's screen: the app version and the row that opens the design-system review area.
 * Boundary: reads the Expo config and navigates; no writes and no data fetching.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import { Card, ListGroup } from "heroui-native";

import { Screen } from "../components/ui/screen";
import type { SettingsStackParamList } from "../navigation/types";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  designSystem: "Design system",
  designSystemDescription: "Review every component in light, dark and right-to-left",
} as const;

/** The Settings tab: the design-system row (development builds only), and a card with the app version, or `dev` without one in the Expo config. */
export function SettingsScreen({
  navigation,
}: NativeStackScreenProps<SettingsStackParamList, "Settings">) {
  return (
    <Screen>
      {/* The design-system review area is a development surface: release builds leave it out. */}
      {__DEV__ ? (
        <ListGroup>
          <ListGroup.Item onPress={() => navigation.navigate("DesignSystem")}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{STRINGS.designSystem}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {STRINGS.designSystemDescription}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>
      ) : null}
      <Card>
        <Card.Body>
          <Card.Title>Version</Card.Title>
          <Card.Description>{Constants.expoConfig?.version ?? "dev"}</Card.Description>
        </Card.Body>
      </Card>
    </Screen>
  );
}
