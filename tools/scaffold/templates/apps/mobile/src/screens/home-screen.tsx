import { useNavigation } from "@react-navigation/native";
import { Button, Card } from "heroui-native";
import { Text } from "react-native";

import { Glass } from "../components/ui/glass";
import { Screen } from "../components/ui/screen";

const ITEMS = ["1", "2", "3"];

export function HomeScreen() {
  const navigation = useNavigation();
  return (
    <Screen>
      <Glass>
        <Text className="text-lg font-semibold text-foreground">Welcome to {{TITLE}}</Text>
        <Text className="mt-1 text-muted">
          Expo SDK 57 · React Navigation · HeroUI Native · Liquid Glass
        </Text>
      </Glass>
      <Card>
        <Card.Body className="gap-3">
          <Card.Title>Items</Card.Title>
          {ITEMS.map((id) => (
            <Button
              key={id}
              variant="secondary"
              onPress={() => navigation.navigate("Item", { id })}
            >
              {`Open item ${id}`}
            </Button>
          ))}
        </Card.Body>
      </Card>
    </Screen>
  );
}
