/**
 * Stackra file contract:
 * Purpose: the "transitions" demo of the web ViewStack: a list of orders that drills down to one order and back, with
 *          the transition picked above it. Switch the page to Arabic to see the push come from the left.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0329 (motion layer); ADR 0060 (light, dark, RTL); STA-1371.
 */
import type { ViewStackTransition } from "@stackra/ui/contracts";
import {
  Button,
  Card,
  NumberTicker,
  RadioGroup,
  Text,
  useCatalogueText,
  useViewStack,
  ViewStack,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { VIEW_STACK_KEYS } from "#src/demos/free/view-stack/view-stack-keys.constant";

/** The demo's keys. */
const K = VIEW_STACK_KEYS.view_stack;

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
    <ul className="grid gap-2">
      {ORDERS.map((order) => (
        <li key={order.number}>
          <Button
            variant="secondary"
            isFullWidth
            onPress={() => {
              onOpen(order.number);
              push("order");
            }}
          >
            {t(K.open, { number: order.number })}
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** The ViewStack demo: transitions. */
export default function Transitions() {
  const t = useCatalogueText(MESSAGES.en);
  const [transition, setTransition] = useState<ViewStackTransition>("push");
  const [open, setOpen] = useState<number>(ORDERS[0].number);
  const total = ORDERS.find((order) => order.number === open)?.total ?? 0;
  return (
    <div className="grid w-full max-w-md gap-4">
      <RadioGroup
        label={t(K.transition_label)}
        orientation="horizontal"
        value={transition}
        onChange={(next) => setTransition(next as ViewStackTransition)}
        options={TRANSITIONS.map(([value, key]) => ({ value, label: t(K.transitions[key]) }))}
      />
      <Card>
        <Card.Content>
          <ViewStack defaultView="list" transition={transition}>
            <ViewStack.View id="list" label={t(K.orders)}>
              <OrderList onOpen={setOpen} />
            </ViewStack.View>
            <ViewStack.View id="order" label={t(K.order, { number: open })}>
              <div className="grid gap-3">
                <div>
                  <ViewStack.Back>{t(K.back)}</ViewStack.Back>
                </div>
                <Text>{t(K.status)}</Text>
                <div className="flex items-baseline justify-between gap-3">
                  <Text tone="muted">{t(K.total)}</Text>
                  <span className="text-2xl font-semibold">
                    <NumberTicker value={total} format={MONEY} />
                  </span>
                </div>
              </div>
            </ViewStack.View>
          </ViewStack>
        </Card.Content>
      </Card>
    </div>
  );
}
