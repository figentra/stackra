/**
 * Stackra file contract:
 * Purpose: the Settings tab's screen, which shows the app version.
 * Boundary: reads the Expo config only; no writes and no data fetching.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import Constants from "expo-constants";
import { Card } from "heroui-native";

import { Screen } from "../components/ui/screen";

/** The Settings tab: a card with the app version, or `dev` when the Expo config carries none. */
export function SettingsScreen() {
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
