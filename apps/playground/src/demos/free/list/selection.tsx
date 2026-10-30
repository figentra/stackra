/**
 * Stackra file contract:
 * Purpose: the "selection" demo of the web List: One keeps a single row selected and pressing it again clears it;
 *          several toggles each row. A row selects or acts, never both.
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

/** The List demo: selection. */
export default function Selection() {
  const t = useCatalogueText(MESSAGES.en);
  /** The three channels of the selection samples. */
  const CHANNELS = [
    {
      id: "email",
      title: t(K.sample.email),
      description: t(K.sample.daily_summary),
      startIcon: "bell",
    },
    {
      id: "push",
      title: t(K.sample.push),
      description: t(K.sample.as_it_happens),
      startIcon: "bell",
    },
    {
      id: "sms",
      title: t(K.sample.sms),
      description: t(K.sample.urgent_only),
      startIcon: "bell",
      isDisabled: true,
    },
    { id: "chat", title: t(K.sample.chat), description: t(K.sample.mentions), startIcon: "bell" },
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <UiList
        label={t(K.single_label)}
        items={CHANNELS}
        selectionMode="single"
        defaultSelectedKeys={["push"]}
      />
      <UiList
        label={t(K.multiple_label)}
        items={CHANNELS}
        selectionMode="multiple"
        defaultSelectedKeys={["email", "chat"]}
      />
    </div>
  );
}
