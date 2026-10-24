/**
 * Stackra file contract:
 * Purpose: the Settings tab's screen, the app's settings: today the app version; the theme and display settings
 *          (the playground's Theme Studio as native controls) join it.
 * Boundary: reads the Expo config; no writes and no data fetching.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import Constants from "expo-constants";
import { Card } from "heroui-native";

import { Screen } from "../components/ui/screen";

/** The Settings tab: a card with the app version, or `dev` without one in the Expo config. */
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
