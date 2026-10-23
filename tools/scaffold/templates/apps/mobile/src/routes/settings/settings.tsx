/**
 * Stackra file contract:
 * Purpose: the page of the settings route: the app version.
 * Boundary: presentation only; reads the Expo config.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 14, rule R7).
 */
import Constants from "expo-constants";
import { Card } from "heroui-native";

import { Screen } from "#src/components/screen";

/** The Settings tab's page. */
export function Settings() {
  return (
    <Screen>
      <Card>
        <Card.Body>
          <Card.Title>Version</Card.Title>
          <Card.Description>{Constants.expoConfig?.version ?? "dev"}</Card.Description>
        </Card.Body>
      </Card>
    </Screen>
  );
}
