/**
 * Stackra file contract:
 * Purpose: the detail screen for one item, typed by the `Item` route.
 * Boundary: renders the id from the route; no data fetching.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card } from "heroui-native";

import { Screen } from "../components/ui/screen";
import type { RootStackParamList } from "../navigation/root-stack-param-list.type";

/** Screen text, in one place until @stackra/i18n. */
const STRINGS = { description: "Opened with a typed `id` param." } as const;

/** Dynamic route: `id` comes from `navigate("Item", { id })` or the deep link `stackra://items/<id>`. */
export function ItemScreen({ route }: NativeStackScreenProps<RootStackParamList, "Item">) {
  return (
    <Screen>
      <Card>
        <Card.Body>
          <Card.Title>{`Item ${route.params.id}`}</Card.Title>
          <Card.Description>{STRINGS.description}</Card.Description>
        </Card.Body>
      </Card>
    </Screen>
  );
}
