/**
 * Stackra file contract:
 * Purpose: the page of the item route, a dynamic route whose `id` comes from `navigate("Item", { id })` or the deep
 *          link `{{NAME}}://items/<id>`.
 * Boundary: presentation only; reads its typed route params.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 14, rule R7).
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card } from "heroui-native";

import { Screen } from "#src/components/screen";
import type { RootStackParamList } from "#src/navigation/types";

/** The item page, titled with its `id` param. */
export function Item({ route }: NativeStackScreenProps<RootStackParamList, "Item">) {
  return (
    <Screen>
      <Card>
        <Card.Body>
          <Card.Title>{`Item ${route.params.id}`}</Card.Title>
          <Card.Description>Opened with a typed `id` param.</Card.Description>
        </Card.Body>
      </Card>
    </Screen>
  );
}
