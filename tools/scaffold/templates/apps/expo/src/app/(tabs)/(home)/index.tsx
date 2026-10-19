import { Button, Card } from "heroui-native";
import { Text } from "react-native";

import { Glass } from "@/components/ui/glass";
import { Screen } from "@/components/ui/screen";

export default function Home() {
  return (
    <Screen>
      <Glass>
        <Text className="text-lg font-semibold text-foreground">Welcome to {{ TITLE }}</Text>
        <Text className="mt-1 text-muted">Expo SDK 57 · HeroUI Native · Liquid Glass</Text>
      </Glass>
      <Card>
        <Card.Body>
          <Card.Title>Get started</Card.Title>
          <Card.Description>Screens live in app/, shared UI in components/.</Card.Description>
        </Card.Body>
      </Card>
      <Button>Get started</Button>
    </Screen>
  );
}
