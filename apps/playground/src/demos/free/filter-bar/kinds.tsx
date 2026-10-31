/**
 * Stackra file contract:
 * Purpose: the "kinds" demo of the web Filter bar: each column type gives one filter editor and one condition. An editor
 *          left empty drops its chip and its condition, but a yes or no never counts as empty, because no is an answer.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0318 (decisions 1 to 3); ADR 0060 (light, dark, RTL).
 */
import { Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FILTER_BAR_KEYS } from "#src/demos/free/filter-bar/filter-bar-keys.constant";

/** The demo's keys. */
const K = FILTER_BAR_KEYS.filter_bar;

/** The column types a filter is derived from, in the order the list shows them. */
const KINDS = ["choice", "text", "number", "date", "boolean"] as const;

/** Filter bar: Kinds of filter. */
export default function Kinds() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul aria-label={t(K.kinds_list)} className="grid gap-1">
      {KINDS.map((kind) => (
        <li key={kind}>
          <Text>
            <bdi>{t(K.kind_rows[kind])}</bdi>
          </Text>
        </li>
      ))}
    </ul>
  );
}
