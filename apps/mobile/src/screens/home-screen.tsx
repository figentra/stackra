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

/** Screen text, in one place until @stackra/i18n. */
const STRINGS = {
  welcome: "Welcome to Stackra",
  stack: "Expo SDK 57 · React Navigation · HeroUI Native · Liquid Glass",
  items: "Items",
} as const;

/** The Home tab: a welcome panel, then a card with a button that opens each item. */
export function HomeScreen() {
  const navigation = useNavigation();
  return (
    <Screen>
      {/* Content sits on a solid card: glass is for controls and navigation (STA-457). */}
      <Card>
        <Card.Body>
          <Card.Title>{STRINGS.welcome}</Card.Title>
          <Card.Description>{STRINGS.stack}</Card.Description>
        </Card.Body>
      </Card>
      <Card>
        <Card.Body className="gap-3">
          <Card.Title>{STRINGS.items}</Card.Title>
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
