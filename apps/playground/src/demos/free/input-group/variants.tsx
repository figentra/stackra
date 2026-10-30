/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web Input group: Primary sits on the page; secondary is for a surface that is
 *          already tinted, so it is shown on one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 7 and 10); ADR 0060 (light, dark, RTL).
 */
import { InputGroup as UiInputGroup, Surface, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { INPUT_GROUP_KEYS } from "#src/demos/free/input-group/input-group-keys.constant";

/** The demo's keys. */
const K = INPUT_GROUP_KEYS.input_group;

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** Input group: Variants. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={GRID}>
      <UiInputGroup label={t(K.primary)} variant="primary" prefix="$" defaultValue="12" />
      <Surface variant="secondary" className="p-4">
        <UiInputGroup label={t(K.secondary)} variant="secondary" prefix="$" defaultValue="12" />
      </Surface>
    </div>
  );
}
