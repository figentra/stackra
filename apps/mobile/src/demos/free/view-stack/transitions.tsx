/**
 * Stackra file contract:
 * Purpose: the "transitions" demo of the native ViewStack: a list of orders that drills down to one order and back,
 *          with the transition picked above it. In Arabic the push comes from the left.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0329.
 */
import type { ViewStackTransition } from "@stackra/ui/contracts";
import {
  Button,
  NumberTicker,
  RadioGroup,
  Surface,
  Text,
  useCatalogueText,
  useViewStack,
  ViewStack,
} from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { VIEW_STACK_DEMO_KEYS } from "#src/demos/free/view-stack/view-stack-demo-keys.constant";

/** The demo's keys. */
const K = VIEW_STACK_DEMO_KEYS.demo_free.view_stack.transitions;

/** The orders in the list: number and total. */
const ORDERS = [
  { number: 1042, total: 186 },
  { number: 1043, total: 74 },
  { number: 1044, total: 312 },
] as const;

/** Riyals, as the order totals are written. */
const MONEY = { style: "currency", currency: "SAR" } as const;

/** The transitions, each with its catalogue key. */
const TRANSITIONS = [
  ["push", "push"],
  ["push-parallax", "push_parallax"],
  ["from-top", "from_top"],
  ["fade", "fade"],
  ["none", "none"],
] as const;

/** The list view: one button per order, each opening its view. */
function OrderList({ onOpen }: { readonly onOpen: (number: number) => void }) {
  const t = useCatalogueText(MESSAGES.en);
  const { push } = useViewStack();
  return (
    <View className="gap-2">
      {ORDERS.map((order) => (
        <Button
          key={order.number}
          variant="secondary"
          isFullWidth
          onPress={() => {
            onOpen(order.number);
            push("order");
          }}
        >
          {t(K.open, { number: order.number })}
        </Button>
      ))}
    </View>
  );
}

/** Drill into an order and back, with the transition picked above. */
export default function Transitions() {
  const t = useCatalogueText(MESSAGES.en);
  const [transition, setTransition] = useState<ViewStackTransition>("push");
  const [open, setOpen] = useState<number>(ORDERS[0].number);
  const total = ORDERS.find((order) => order.number === open)?.total ?? 0;
  return (
    <View className="gap-4">
      <RadioGroup
        label={t(K.transition)}
        value={transition}
        onChange={(next) => setTransition(next as ViewStackTransition)}
        options={TRANSITIONS.map(([value, key]) => ({ value, label: t(K[key]) }))}
      />
      <Surface>
        <ViewStack defaultView="list" transition={transition}>
          <ViewStack.View id="list" label={t(K.orders)}>
            <OrderList onOpen={setOpen} />
          </ViewStack.View>
          <ViewStack.View id="order" label={t(K.order, { number: open })}>
            <View className="items-start gap-3">
              <ViewStack.Back>{t(K.back)}</ViewStack.Back>
              <Text>{t(K.status)}</Text>
              <Text tone="muted">{t(K.total)}</Text>
              <NumberTicker value={total} format={MONEY} />
            </View>
          </ViewStack.View>
        </ViewStack>
      </Surface>
    </View>
  );
}
