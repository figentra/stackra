/**
 * Stackra file contract:
 * Purpose: the "names" demo of the web Icon: Only the labelled icon is announced; the decorative one sits beside text
 *          that already says it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 7 and 10); ADR 0060 (right-to-left).
 */
import { Icon as UiIcon, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_KEYS } from "#src/demos/free/icon/icon-keys.constant";

/** The demo's keys. */
const K = ICON_KEYS.icon_page;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** Icon: Decorative and labelled. */
export default function Names() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li className="flex items-center gap-2">
        <UiIcon name="heart" />
        <Text>
          <bdi>{t(K.favourites)}</bdi>
        </Text>
      </li>
      <li className="flex items-center gap-2">
        <UiIcon name="star" label={t(K.rated)} />
      </li>
    </ul>
  );
}
