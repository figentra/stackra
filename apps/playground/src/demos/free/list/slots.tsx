/**
 * Stackra file contract:
 * Purpose: the "slots" demo of the web List: A start icon by name, an avatar as the start element, end content such
 *          as a chip or a value, and a chevron.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0060 (light, dark, RTL).
 */
import { Avatar, Chip, List as UiList, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LIST_KEYS } from "#src/demos/free/list/list-keys.constant";

/** The demo's keys. */
const K = LIST_KEYS.list;

/** The List demo: slots. */
export default function Slots() {
  const t = useCatalogueText(MESSAGES.en);
  /** Rows with every slot. */
  const TEAM = [
    {
      id: "ada",
      title: "Ada Lovelace",
      description: t(K.sample.engineering),
      startIcon: <Avatar name="Ada Lovelace" size="sm" />,
      endContent: (
        <Chip size="sm" tone="success">
          {t(K.sample.active)}
        </Chip>
      ),
      hasChevron: true,
    },
    {
      id: "office",
      title: t(K.sample.head_office),
      description: t(K.sample.cairo),
      startIcon: "building",
      endContent: "12 people",
      hasChevron: true,
    },
    { id: "alerts", title: t(K.sample.alerts), startIcon: "bell", endContent: "3 new" },
  ] as const;
  return <UiList label={t(K.slots_label)} items={TEAM} />;
}
