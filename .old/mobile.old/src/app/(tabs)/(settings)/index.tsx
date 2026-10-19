import Constants from "expo-constants";
import { Card } from "heroui-native";

import { Screen } from "@/components/ui/screen";

export default function Settings() {
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
