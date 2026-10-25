/**
 * Stackra file contract:
 * Purpose: the page of the home route: a welcome panel and one button per item.
 * Boundary: presentation and navigation calls; no data fetching.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 14, rule R7).
 */
import { useNavigation } from "@react-navigation/native";
import { Button, Card } from "heroui-native";

import { Screen } from "#src/components/screen";

const ITEMS = ["1", "2", "3"];

/** The Home tab's page. */
export function Home() {
  const navigation = useNavigation();
  return (
    <Screen>
      {/* Content sits on a solid card: Liquid Glass is for the native header, tab bar and controls. */}
      <Card>
        <Card.Body>
          <Card.Title>Welcome to {{TITLE}}</Card.Title>
          <Card.Description>Expo SDK 57 · React Navigation · HeroUI Native · Liquid Glass</Card.Description>
        </Card.Body>
      </Card>
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
