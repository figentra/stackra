/**
 * Stackra file contract:
 * Purpose: the "live-select" demo of the web List: Select rows; the page reports the ids in the order of the rows.
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

/** List: Try selecting. */
export default function LiveSelect() {
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
  const [channels, setChannels] = useState<readonly string[]>(["email"]);

  return (
    <div className="grid gap-6">
      <UiList
        label={t(K.live_select_label)}
        items={CHANNELS}
        selectionMode="multiple"
        selectedKeys={channels}
        onSelectionChange={setChannels}
      />
      <Text role="status" tone="muted" data-testid="list-selected">
        {t(K.selected, { keys: channels.join(", ") || "none" })}
      </Text>
    </div>
  );
}
