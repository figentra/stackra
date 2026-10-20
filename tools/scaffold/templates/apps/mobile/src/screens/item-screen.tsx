import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card } from "heroui-native";

import { Screen } from "../components/ui/screen";
import type { RootStackParamList } from "../navigation/types";

/** Dynamic route: `id` comes from `navigate("Item", { id })` or the deep link `{{NAME}}://items/<id>`. */
export function ItemScreen({ route }: NativeStackScreenProps<RootStackParamList, "Item">) {
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
