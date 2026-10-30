/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web List: Rows of text only: a title, and a title with a description.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0060 (light, dark, RTL).
 */
import { List as UiList, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LIST_KEYS } from "#src/demos/free/list/list-keys.constant";

/** The demo's keys. */
const K = LIST_KEYS.list;

/** The List demo: basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  /** The rows of the basic list. */
  const ORDERS = [
    { id: "1042", title: t(K.sample.order_1042), description: t(K.sample.shipped_on_monday) },
    { id: "1043", title: t(K.sample.order_1043), description: t(K.sample.waiting_for_payment) },
    { id: "1044", title: t(K.sample.order_1044) },
  ] as const;
  return <UiList label={t(K.basics_label)} items={ORDERS} />;
}
