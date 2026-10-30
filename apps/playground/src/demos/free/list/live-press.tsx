/**
 * Stackra file contract:
 * Purpose: the "live-press" demo of the web List: Press a row; the page reports which one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0060 (light, dark, RTL).
 */
import { List as UiList, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LIST_KEYS } from "#src/demos/free/list/list-keys.constant";

/** The demo's keys. */
const K = LIST_KEYS.list;

/** List: Try pressing. */
export default function LivePress() {
  const t = useCatalogueText(MESSAGES.en);
  /** The rows of the basic list. */
  const ORDERS = [
    { id: "1042", title: t(K.sample.order_1042), description: t(K.sample.shipped_on_monday) },
    { id: "1043", title: t(K.sample.order_1043), description: t(K.sample.waiting_for_payment) },
    { id: "1044", title: t(K.sample.order_1044) },
  ] as const;
  const [pressed, setPressed] = useState<string | undefined>(undefined);

  const press = (title: string) => () => setPressed(title);

  return (
    <div className="grid gap-6">
      <UiList
        label={t(K.press_label)}
        items={ORDERS.map((order) => ({
          id: order.id,
          title: order.title,
          hasChevron: true,
          onPress: press(order.title),
        }))}
      />
      <Text role="status" tone="muted" data-testid="list-pressed">
        {pressed === undefined ? t(K.none_pressed) : t(K.pressed, { title: pressed })}
      </Text>
    </div>
  );
}
