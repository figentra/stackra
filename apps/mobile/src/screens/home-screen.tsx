/**
 * Stackra file contract:
 * Purpose: the Home tab's screen: a welcome panel and one button per item.
 * Boundary: presentation and navigation calls; no data fetching.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import { useNavigation } from "@react-navigation/native";
import { Button, Card } from "heroui-native";

import { Screen } from "../components/ui/screen";

const ITEMS = ["1", "2", "3"];

/** The Home tab: a welcome panel, then a card with a button that opens each item. */
export function HomeScreen() {
  const navigation = useNavigation();
  return (
    <Screen>
      {/* Content sits on a solid card: glass is for controls and navigation (the owner's decision, 2026-10-24). */}
      <Card>
        <Card.Body>
          <Card.Title>Welcome to Stackra</Card.Title>
          <Card.Description>
            Expo SDK 57 · React Navigation · HeroUI Native · Liquid Glass
          </Card.Description>
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
